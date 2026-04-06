import mongoose from "mongoose";
import BulkManufacturingAccount from "../models/BulkManufacturingAccount.js";
import BulkManufacturingRequirement from "../models/BulkManufacturingRequirement.js";
import BulkManufacturingRequest from "../models/BulkManufacturingRequest.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import {
  buildProductFields,
  cleanupChangedProductAssets,
  destroyProductAssets,
} from "./productDetailsController.js";

const PARTNER_EDITABLE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "REJECTED",
];

const PARTNER_DELETABLE_STATUSES = ["SUBMITTED", "REVISION_REQUESTED", "REJECTED"];

const REQUIRED_DOCUMENT_LABELS = {
  importLicenseFile: "Import License",
  gdpCert: "GDP / GMP Certificate",
  buyerLetter: "Buyer / Procurement Letter",
  proofOfFunds: "Proof of Funds",
  companyRegCert: "Company Registration Certificate",
  passportCopy: "Authorized Person Passport Copy",
  companyProfile: "Company Profile / Brochure",
};

const BULK_ORDER_OPEN_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
];

const BULK_ORDER_STATUS_TRANSITIONS = {
  PLACED: ["ACCEPTED", "CONFIRMED", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

const pushRequirementStatusHistory = (
  requirement,
  status,
  note,
  actor = "Partner",
) => {
  requirement.statusHistory = requirement.statusHistory || [];
  requirement.statusHistory.push({
    status,
    note: note || "",
    actor,
    changedAt: new Date(),
  });
};

const getRequestForAccount = async (account) =>
  BulkManufacturingRequest.findById(account.requestId);

const buildDocumentList = (request) =>
  Object.entries(request?.documents || {})
    .filter(([, url]) => Boolean(String(url || "").trim()))
    .map(([key, url]) => ({
      key,
      label: REQUIRED_DOCUMENT_LABELS[key] || key,
      url,
    }));

const getBulkManufacturingAccountObjectId = (account) => {
  const value = account?._id || account;
  return mongoose.Types.ObjectId.isValid(String(value))
    ? new mongoose.Types.ObjectId(String(value))
    : null;
};

const buildBulkProductFilter = (account, query = {}) => {
  const accountObjectId = getBulkManufacturingAccountObjectId(account);
  const filter = {
    bulkManufacturingAccountId: accountObjectId,
  };
  const { search = "", section = "ALL", status = "ALL", category = "" } = query;
  const trimmedSearch = String(search || "").trim();

  if (section && section !== "ALL") {
    filter.sections = section;
  }

  if (status && status !== "ALL") {
    filter.statusActive = status;
  }

  if (category && mongoose.isValidObjectId(String(category))) {
    filter.category = category;
  }

  if (trimmedSearch) {
    const regex = new RegExp(trimmedSearch, "i");
    filter.$or = [
      { brandName: regex },
      { genericName: regex },
      { genericCompositions: regex },
      { manufacturer: regex },
      { hsn: regex },
    ];
  }

  return {
    accountObjectId,
    filter,
    trimmedSearch,
    section,
    status,
    category,
  };
};

const normalizeSearchValue = (value) =>
  String(value || "").trim().toLowerCase();

const getBulkOrderDisplayId = (order) =>
  order?.orderId ||
  order?.invoiceNumber ||
  String(order?._id || "").slice(-8).toUpperCase();

const getBulkOrderSearchHaystack = (order) =>
  [
    getBulkOrderDisplayId(order),
    order?.invoiceNumber,
    order?.paymentMode,
    order?.paymentStatus,
    order?.orderStatus,
    order?.userId?.name,
    order?.userId?.email,
    order?.userId?.phone,
    order?.address?.fullName,
    order?.address?.phone,
    order?.address?.city,
    order?.address?.state,
    ...(order?.items || []).flatMap((item) => [
      item?.name,
      item?.manufacturer,
      item?.genericName,
      item?.hsn,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const sortBulkOrders = (orders = [], sortBy = "newest") => {
  const list = [...orders];

  if (sortBy === "oldest") {
    return list.sort(
      (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
    );
  }

  if (sortBy === "amount_high") {
    return list.sort(
      (left, right) =>
        Number(right.totalAmount || 0) - Number(left.totalAmount || 0),
    );
  }

  if (sortBy === "amount_low") {
    return list.sort(
      (left, right) =>
        Number(left.totalAmount || 0) - Number(right.totalAmount || 0),
    );
  }

  return list.sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
  );
};

const summarizeBulkOrders = (orders = []) =>
  orders.reduce(
    (summary, order) => {
      summary.totalOrders += 1;
      summary.totalRevenue += Number(order.totalAmount || 0);
      summary.totalUnits += (order.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      );

      if (BULK_ORDER_OPEN_STATUSES.includes(order.orderStatus)) {
        summary.openOrders += 1;
      }

      if (order.orderStatus === "DELIVERED") {
        summary.deliveredOrders += 1;
      }

      if (order.orderStatus === "CANCELLED") {
        summary.cancelledOrders += 1;
      }

      if (order.paymentStatus === "PAID") {
        summary.paidOrders += 1;
      } else {
        summary.pendingPaymentOrders += 1;
      }

      return summary;
    },
    {
      totalOrders: 0,
      openOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      paidOrders: 0,
      pendingPaymentOrders: 0,
      totalRevenue: 0,
      totalUnits: 0,
      averageOrderValue: 0,
    },
  );

export const getBulkManufacturingDashboard = async (req, res) => {
  try {
    const account = req.bulkManufacturingAccount;
    const accountObjectId = getBulkManufacturingAccountObjectId(account);
    const request = await getRequestForAccount(account);

    const [
      totalRequirements,
      submittedRequirements,
      quotedRequirements,
      approvedRequirements,
      recentRequirements,
      totalProducts,
      activeProducts,
      sectionCoverage,
      recentProducts,
      stockSummary,
      totalWebsiteOrders,
      openWebsiteOrders,
      deliveredWebsiteOrders,
      websiteOrderRevenue,
      recentOrders,
    ] = await Promise.all([
      BulkManufacturingRequirement.countDocuments({ accountId: account._id }),
      BulkManufacturingRequirement.countDocuments({
        accountId: account._id,
        status: { $in: ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED"] },
      }),
      BulkManufacturingRequirement.countDocuments({
        accountId: account._id,
        status: "QUOTED",
      }),
      BulkManufacturingRequirement.countDocuments({
        accountId: account._id,
        status: "APPROVED",
      }),
      BulkManufacturingRequirement.find({ accountId: account._id })
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean(),
      Product.countDocuments({
        bulkManufacturingAccountId: account._id,
      }),
      Product.countDocuments({
        bulkManufacturingAccountId: account._id,
        statusActive: "active",
      }),
      Product.distinct("sections", {
        bulkManufacturingAccountId: account._id,
      }),
      Product.find({
        bulkManufacturingAccountId: account._id,
      })
        .select(
          "_id brandName manufacturer totalStocks stocks statusActive sections images updatedAt",
        )
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Product.aggregate([
        {
          $match: {
            bulkManufacturingAccountId: accountObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalProductStock: {
              $sum: {
                $ifNull: ["$totalStocks", "$stocks"],
              },
            },
          },
        },
      ]),
      Order.countDocuments({
        bulkManufacturingAccountId: accountObjectId,
      }),
      Order.countDocuments({
        bulkManufacturingAccountId: accountObjectId,
        orderStatus: { $in: BULK_ORDER_OPEN_STATUSES },
      }),
      Order.countDocuments({
        bulkManufacturingAccountId: accountObjectId,
        orderStatus: "DELIVERED",
      }),
      Order.aggregate([
        {
          $match: {
            bulkManufacturingAccountId: accountObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          },
        },
      ]),
      Order.find({
        bulkManufacturingAccountId: accountObjectId,
      })
        .select(
          "_id orderId invoiceNumber totalAmount paymentMode paymentStatus orderStatus createdAt items address",
        )
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);
    const totalProductStock = Number(stockSummary?.[0]?.totalProductStock || 0);
    const totalOrderRevenue = Number(
      websiteOrderRevenue?.[0]?.totalRevenue || 0,
    );

    return res.status(200).json({
      summary: {
        applicationStatus: request?.status || "PENDING",
        documentReviewStatus: request?.documentReviewStatus || "PENDING",
        totalRequirements,
        submittedRequirements,
        quotedRequirements,
        approvedRequirements,
        uploadedDocuments: buildDocumentList(request).length,
        totalProducts,
        activeProducts,
        totalSections: (sectionCoverage || []).filter(Boolean).length,
        totalProductStock,
        totalWebsiteOrders,
        openWebsiteOrders,
        deliveredWebsiteOrders,
        totalOrderRevenue,
      },
      company: {
        companyName: account.companyName,
        contactName: account.contactName,
        email: account.email,
        username: account.username,
        country: account.country,
      },
      application: request
        ? {
            id: request._id,
            status: request.status,
            reviewNotes: request.reviewNotes,
            rejectionReason: request.rejectionReason,
            documentReviewStatus: request.documentReviewStatus,
            documentReviewNotes: request.documentReviewNotes,
            createdAt: request.createdAt,
          }
        : null,
      recentRequirements,
      recentProducts,
      recentOrders,
    });
  } catch (error) {
    console.error("Bulk manufacturing dashboard error:", error);
    return res.status(500).json({
      message: "Unable to load dashboard.",
    });
  }
};

export const getBulkManufacturingProducts = async (req, res) => {
  try {
    const { accountObjectId, filter, trimmedSearch, section, status, category } =
      buildBulkProductFilter(req.bulkManufacturingAccount, req.query);

    if (!accountObjectId) {
      return res.status(400).json({ message: "Bulk manufacturing account missing." });
    }

    const [products, accountSections] = await Promise.all([
      Product.find(filter)
        .populate("category", "title")
        .populate("subCategory", "title")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      Product.distinct("sections", {
        bulkManufacturingAccountId: accountObjectId,
      }),
    ]);

    const summary = products.reduce(
      (accumulator, product) => {
        accumulator.totalProducts += 1;
        accumulator.totalStock += Number(product.totalStocks || product.stocks || 0);

        if (String(product.statusActive || "").toLowerCase() === "active") {
          accumulator.activeProducts += 1;
        } else {
          accumulator.inactiveProducts += 1;
        }

        if (Array.isArray(product.sections) && product.sections.length) {
          product.sections.forEach((sectionName) =>
            accumulator.sectionSet.add(sectionName),
          );
        } else {
          accumulator.unsectionedProducts += 1;
        }

        return accumulator;
      },
      {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        totalStock: 0,
        unsectionedProducts: 0,
        sectionSet: new Set(),
      },
    );

    const availableSections = [
      ...new Set([...(accountSections || []), ...summary.sectionSet]),
    ].sort((left, right) => left.localeCompare(right));
    delete summary.sectionSet;
    summary.totalSections = availableSections.length;

    return res.status(200).json({
      success: true,
      count: products.length,
      summary,
      filtersApplied: {
        search: trimmedSearch,
        section,
        status,
        category,
      },
      availableSections,
      products,
    });
  } catch (error) {
    console.error("Bulk manufacturing products fetch error:", error);
    return res.status(500).json({
      message: "Unable to load bulk manufacturing products.",
    });
  }
};

export const searchBulkManufacturingProducts = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );
    const query = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

    if (!accountObjectId || !query) {
      return res.status(200).json({ success: true, products: [] });
    }

    const regex = new RegExp(query, "i");
    const products = await Product.find({
      bulkManufacturingAccountId: accountObjectId,
      $or: [
        { brandName: regex },
        { genericCompositions: regex },
        { genericName: regex },
        { manufacturer: regex },
        { hsn: regex },
      ],
    })
      .select(
        "_id brandName mrp images genericCompositions genericName manufacturer totalStocks stocks statusActive sections",
      )
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Bulk manufacturing product search error:", error);
    return res.status(500).json({
      message: "Unable to search bulk manufacturing products.",
    });
  }
};

export const getBulkManufacturingProductById = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      bulkManufacturingAccountId: accountObjectId,
    })
      .populate("category", "title")
      .populate("subCategory", "title");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Bulk manufacturing product detail error:", error);
    return res.status(500).json({
      message: "Unable to load product details.",
    });
  }
};

export const createBulkManufacturingProduct = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );

    const nextFields = await buildProductFields(
      {
        ...(req.body || {}),
        franchiseZoneId: null,
      },
      { requireCategory: true },
    );

    const product = new Product({
      ...nextFields,
      vendor: null,
      franchiseZoneId: null,
      bulkManufacturingAccountId: accountObjectId,
    });
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "title")
      .populate("subCategory", "title");

    return res.status(201).json({
      success: true,
      message: "Product saved successfully.",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Bulk manufacturing product create error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to save product.",
    });
  }
};

export const updateBulkManufacturingProduct = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      bulkManufacturingAccountId: accountObjectId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const nextFields = await buildProductFields(
      {
        ...(req.body || {}),
        franchiseZoneId: null,
      },
      { existingProduct: product },
    );

    await cleanupChangedProductAssets(product, nextFields, req.body || {});

    Object.assign(product, nextFields);
    product.vendor = null;
    product.franchiseZoneId = null;
    product.bulkManufacturingAccountId = accountObjectId;
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "title")
      .populate("subCategory", "title");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Bulk manufacturing product update error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update product.",
    });
  }
};

export const deleteBulkManufacturingProduct = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      bulkManufacturingAccountId: accountObjectId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const existingOrder = await Order.exists({ "items.productId": product._id });
    if (existingOrder) {
      return res.status(400).json({
        message:
          "This product is already part of website orders. Edit the product instead of deleting it.",
      });
    }

    await destroyProductAssets(product);
    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Bulk manufacturing product delete error:", error);
    return res.status(500).json({
      message: "Unable to delete product.",
    });
  }
};

export const getBulkManufacturingOrders = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );
    const {
      from,
      to,
      status = "ALL",
      paymentMode = "ALL",
      paymentStatus = "ALL",
      search = "",
      sortBy = "newest",
    } = req.query;

    const filter = {
      bulkManufacturingAccountId: accountObjectId,
    };

    if (from && to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $gte: new Date(from),
        $lte: endDate,
      };
    }

    if (status && status !== "ALL") {
      filter.orderStatus = status;
    }

    if (paymentMode && paymentMode !== "ALL") {
      filter.paymentMode = paymentMode;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      filter.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone")
      .populate("items.productId", "brandName images genericCompositions manufacturer");

    const normalizedSearch = normalizeSearchValue(search);
    let filteredOrders = normalizedSearch
      ? orders.filter((order) =>
          getBulkOrderSearchHaystack(order).includes(normalizedSearch),
        )
      : orders;

    filteredOrders = sortBulkOrders(filteredOrders, sortBy);
    const summary = summarizeBulkOrders(filteredOrders);
    summary.averageOrderValue = summary.totalOrders
      ? Number((summary.totalRevenue / summary.totalOrders).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      count: filteredOrders.length,
      summary,
      filtersApplied: {
        status,
        paymentMode,
        paymentStatus,
        search,
        from: from || "",
        to: to || "",
        sortBy,
      },
      orders: filteredOrders,
    });
  } catch (error) {
    console.error("Bulk manufacturing orders fetch error:", error);
    return res.status(500).json({
      message: "Unable to load bulk manufacturing orders.",
    });
  }
};

export const getBulkManufacturingOrderById = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      bulkManufacturingAccountId: accountObjectId,
    })
      .populate("userId", "name email phone")
      .populate("items.productId", "brandName images genericCompositions manufacturer");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Bulk manufacturing order detail error:", error);
    return res.status(500).json({
      message: "Unable to load order details.",
    });
  }
};

export const updateBulkManufacturingOrderStatus = async (req, res) => {
  try {
    const accountObjectId = getBulkManufacturingAccountObjectId(
      req.bulkManufacturingAccount,
    );
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      bulkManufacturingAccountId: accountObjectId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const allowedStatuses = BULK_ORDER_STATUS_TRANSITIONS[order.orderStatus] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot move order from ${order.orderStatus} to ${status}.`,
      });
    }

    order.orderStatus = status;
    order.orderStatusHistory.push({
      status,
      timestamp: new Date(),
    });
    order.trackingHistory.push({
      status,
      time: new Date(),
    });

    if (["PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) {
      order.invoiceReady = true;
    }

    if (status === "DELIVERED") {
      order.deliveredAt = new Date();
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("userId", "name email phone")
      .populate("items.productId", "brandName images genericCompositions manufacturer");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Bulk manufacturing order status update error:", error);
    return res.status(500).json({
      message: "Unable to update order status.",
    });
  }
};

export const getBulkManufacturingProfile = async (req, res) => {
  try {
    const account = req.bulkManufacturingAccount;
    const request = await getRequestForAccount(account);

    return res.status(200).json({
      profile: {
        username: account.username,
        email: account.email,
        companyName: account.companyName,
        fullName: account.contactName,
        designation: account.designation,
        mobile: account.mobile,
        whatsapp: account.whatsapp,
        country: account.country,
        website: account.website,
        applicationStatus: request?.status || "PENDING",
        documentReviewStatus: request?.documentReviewStatus || "PENDING",
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    console.error("Bulk manufacturing profile fetch error:", error);
    return res.status(500).json({
      message: "Unable to load profile.",
    });
  }
};

export const updateBulkManufacturingProfile = async (req, res) => {
  try {
    const account = req.bulkManufacturingAccount;
    const request = await getRequestForAccount(account);
    const {
      fullName = "",
      designation = "",
      mobile = "",
      whatsapp = "",
      companyName = "",
      country = "",
      website = "",
    } = req.body;

    account.contactName = fullName || account.contactName;
    account.designation = designation;
    account.mobile = mobile;
    account.whatsapp = whatsapp;
    account.companyName = companyName || account.companyName;
    account.country = country || account.country;
    account.website = website;

    if (request) {
      request.fullName = fullName || request.fullName;
      request.designation = designation;
      request.mobile = mobile;
      request.whatsapp = whatsapp;
      request.companyName = companyName || request.companyName;
      request.country = country || request.country;
      request.website = website;
      await request.save();
    }

    await account.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      profile: {
        username: account.username,
        email: account.email,
        companyName: account.companyName,
        fullName: account.contactName,
        designation: account.designation,
        mobile: account.mobile,
        whatsapp: account.whatsapp,
        country: account.country,
        website: account.website,
      },
    });
  } catch (error) {
    console.error("Bulk manufacturing profile update error:", error);
    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
};

export const getBulkManufacturingDocuments = async (req, res) => {
  try {
    const request = await getRequestForAccount(req.bulkManufacturingAccount);

    if (!request) {
      return res.status(404).json({ message: "Application not found." });
    }

    return res.status(200).json({
      documents: buildDocumentList(request),
      review: {
        status: request.documentReviewStatus,
        notes: request.documentReviewNotes,
      },
      application: {
        status: request.status,
        reviewNotes: request.reviewNotes,
        rejectionReason: request.rejectionReason,
      },
      history: request.statusHistory || [],
    });
  } catch (error) {
    console.error("Bulk manufacturing documents error:", error);
    return res.status(500).json({
      message: "Unable to load documents.",
    });
  }
};

export const getBulkManufacturingRequirements = async (req, res) => {
  try {
    const { status = "", search = "" } = req.query;
    const filter = { accountId: req.bulkManufacturingAccount._id };

    if (status && status !== "ALL") {
      filter.status = status;
    }

    const requirements = await BulkManufacturingRequirement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const filteredRequirements = search
      ? requirements.filter((item) =>
          [
            item.productName,
            item.quantity,
            item.targetCountry,
            item.notes,
            item.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(String(search).trim().toLowerCase()),
        )
      : requirements;

    const summary = {
      total: await BulkManufacturingRequirement.countDocuments({
        accountId: req.bulkManufacturingAccount._id,
      }),
      open: await BulkManufacturingRequirement.countDocuments({
        accountId: req.bulkManufacturingAccount._id,
        status: { $in: ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED"] },
      }),
      quoted: await BulkManufacturingRequirement.countDocuments({
        accountId: req.bulkManufacturingAccount._id,
        status: "QUOTED",
      }),
      approved: await BulkManufacturingRequirement.countDocuments({
        accountId: req.bulkManufacturingAccount._id,
        status: "APPROVED",
      }),
      closed: await BulkManufacturingRequirement.countDocuments({
        accountId: req.bulkManufacturingAccount._id,
        status: "CLOSED",
      }),
    };

    return res.status(200).json({
      requirements: filteredRequirements,
      summary,
    });
  } catch (error) {
    console.error("Bulk manufacturing requirements fetch error:", error);
    return res.status(500).json({
      message: "Unable to load requirements.",
    });
  }
};

export const createBulkManufacturingRequirement = async (req, res) => {
  try {
    const account = req.bulkManufacturingAccount;
    const request = await getRequestForAccount(account);
    const {
      productName,
      dosageForm = "",
      packaging = "",
      quantity,
      targetCountry = "",
      targetTimeline = "",
      priority = "MEDIUM",
      notes = "",
      attachmentUrl = "",
    } = req.body;

    if (!productName || !quantity) {
      return res.status(400).json({
        message: "Product name and quantity are required.",
      });
    }

    const requirement = await BulkManufacturingRequirement.create({
      accountId: account._id,
      requestId: request?._id,
      productName,
      dosageForm,
      packaging,
      quantity,
      targetCountry,
      targetTimeline,
      priority,
      notes,
      attachmentUrl,
    });

    return res.status(201).json({
      message: "Requirement submitted successfully.",
      requirement,
    });
  } catch (error) {
    console.error("Bulk manufacturing requirement create error:", error);
    return res.status(500).json({
      message: "Unable to create requirement.",
    });
  }
};

export const updateBulkManufacturingRequirement = async (req, res) => {
  try {
    const requirement = await BulkManufacturingRequirement.findOne({
      _id: req.params.id,
      accountId: req.bulkManufacturingAccount._id,
    });

    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found." });
    }

    if (!PARTNER_EDITABLE_STATUSES.includes(requirement.status)) {
      return res.status(400).json({
        message: "This requirement can no longer be edited.",
      });
    }

    const {
      productName,
      dosageForm,
      packaging,
      quantity,
      targetCountry,
      targetTimeline,
      priority,
      notes,
      attachmentUrl,
    } = req.body;

    requirement.productName = productName ?? requirement.productName;
    requirement.dosageForm = dosageForm ?? requirement.dosageForm;
    requirement.packaging = packaging ?? requirement.packaging;
    requirement.quantity = quantity ?? requirement.quantity;
    requirement.targetCountry = targetCountry ?? requirement.targetCountry;
    requirement.targetTimeline = targetTimeline ?? requirement.targetTimeline;
    requirement.priority = priority ?? requirement.priority;
    requirement.notes = notes ?? requirement.notes;
    requirement.attachmentUrl = attachmentUrl ?? requirement.attachmentUrl;

    if (requirement.status === "REVISION_REQUESTED") {
      requirement.status = "SUBMITTED";
      pushRequirementStatusHistory(
        requirement,
        "SUBMITTED",
        "Requirement revised and resubmitted by partner.",
        "Partner",
      );
    }

    await requirement.save();

    return res.status(200).json({
      message: "Requirement updated successfully.",
      requirement,
    });
  } catch (error) {
    console.error("Bulk manufacturing requirement update error:", error);
    return res.status(500).json({
      message: "Unable to update requirement.",
    });
  }
};

export const deleteBulkManufacturingRequirement = async (req, res) => {
  try {
    const requirement = await BulkManufacturingRequirement.findOne({
      _id: req.params.id,
      accountId: req.bulkManufacturingAccount._id,
    });

    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found." });
    }

    if (!PARTNER_DELETABLE_STATUSES.includes(requirement.status)) {
      return res.status(400).json({
        message: "This requirement cannot be deleted anymore.",
      });
    }

    await requirement.deleteOne();

    return res.status(200).json({
      message: "Requirement deleted successfully.",
    });
  } catch (error) {
    console.error("Bulk manufacturing requirement delete error:", error);
    return res.status(500).json({
      message: "Unable to delete requirement.",
    });
  }
};
