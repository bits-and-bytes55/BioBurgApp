import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import {
  buildProductFields,
  cleanupChangedProductAssets,
  destroyProductAssets,
} from "./productDetailsController.js";

const getManufacturerAccountObjectId = (manufacturer) => {
  const value = manufacturer?._id || manufacturer;
  return mongoose.Types.ObjectId.isValid(String(value))
    ? new mongoose.Types.ObjectId(String(value))
    : null;
};

const buildManufacturerProductFilter = (manufacturer, query = {}) => {
  const accountObjectId = getManufacturerAccountObjectId(manufacturer);
  const filter = {
    manufacturerAccountId: accountObjectId,
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

const MANUFACTURER_ORDER_OPEN_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
];

const MANUFACTURER_ORDER_STATUS_TRANSITIONS = {
  PLACED: ["ACCEPTED", "CONFIRMED", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

const normalizeSearchValue = (value) =>
  String(value || "").trim().toLowerCase();

const getManufacturerOrderDisplayId = (order) =>
  order?.orderId ||
  order?.invoiceNumber ||
  String(order?._id || "").slice(-8).toUpperCase();

const getManufacturerOrderSearchHaystack = (order) =>
  [
    getManufacturerOrderDisplayId(order),
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

const sortManufacturerOrders = (orders = [], sortBy = "newest") => {
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

const summarizeManufacturerOrders = (orders = []) =>
  orders.reduce(
    (summary, order) => {
      const totalAmount = Number(order.totalAmount || 0);

      summary.totalOrders += 1;
      summary.totalRevenue += totalAmount;
      summary.totalUnits += (order.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      );

      if (MANUFACTURER_ORDER_OPEN_STATUSES.includes(order.orderStatus)) {
        summary.openOrders += 1;
      }

      if (order.orderStatus === "DELIVERED") {
        summary.deliveredOrders += 1;
        summary.settlementReadyAmount += totalAmount;
      }

      if (order.orderStatus === "CANCELLED") {
        summary.cancelledOrders += 1;
      }

      if (order.paymentStatus === "PAID") {
        summary.paidOrders += 1;
        summary.collectedAmount += totalAmount;
      } else if (order.paymentStatus === "FAILED") {
        summary.failedPaymentOrders += 1;
      } else {
        summary.pendingPaymentOrders += 1;
        summary.outstandingAmount += totalAmount;
      }

      if (order.paymentMode === "ONLINE") {
        summary.onlineOrders += 1;
      }

      if (order.paymentMode === "COD") {
        summary.codOrders += 1;
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
      failedPaymentOrders: 0,
      totalRevenue: 0,
      totalUnits: 0,
      averageOrderValue: 0,
      collectedAmount: 0,
      outstandingAmount: 0,
      settlementReadyAmount: 0,
      onlineOrders: 0,
      codOrders: 0,
    },
  );

export const getManufacturerProducts = async (req, res) => {
  try {
    const { accountObjectId, filter, trimmedSearch, section, status, category } =
      buildManufacturerProductFilter(req.manufacturer, req.query);

    if (!accountObjectId) {
      return res.status(400).json({ message: "Manufacturer account missing." });
    }

    const [products, accountSections] = await Promise.all([
      Product.find(filter)
        .populate("category", "title")
        .populate("subCategory", "title")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      Product.distinct("sections", {
        manufacturerAccountId: accountObjectId,
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
    console.error("Manufacturer products fetch error:", error);
    return res.status(500).json({
      message: "Unable to load manufacturer products.",
    });
  }
};

export const searchManufacturerProducts = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);
    const query = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

    if (!accountObjectId || !query) {
      return res.status(200).json({ success: true, products: [] });
    }

    const regex = new RegExp(query, "i");
    const products = await Product.find({
      manufacturerAccountId: accountObjectId,
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
    console.error("Manufacturer product search error:", error);
    return res.status(500).json({
      message: "Unable to search manufacturer products.",
    });
  }
};

export const getManufacturerProductById = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      manufacturerAccountId: accountObjectId,
    })
      .populate("category", "title")
      .populate("subCategory", "title");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Manufacturer product detail error:", error);
    return res.status(500).json({
      message: "Unable to load product details.",
    });
  }
};

export const createManufacturerProduct = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);
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
      bulkManufacturingAccountId: null,
      manufacturerAccountId: accountObjectId,
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
    console.error("Manufacturer product create error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to save product.",
    });
  }
};

export const updateManufacturerProduct = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      manufacturerAccountId: accountObjectId,
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
    product.bulkManufacturingAccountId = null;
    product.manufacturerAccountId = accountObjectId;
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
    console.error("Manufacturer product update error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update product.",
    });
  }
};

export const deleteManufacturerProduct = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      manufacturerAccountId: accountObjectId,
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
    console.error("Manufacturer product delete error:", error);
    return res.status(500).json({
      message: "Unable to delete product.",
    });
  }
};

export const getManufacturerOrders = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);
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
      manufacturerAccountId: accountObjectId,
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
      .populate(
        "items.productId",
        "brandName images genericCompositions manufacturer manufacturerAccountId",
      );

    const normalizedSearch = normalizeSearchValue(search);
    let filteredOrders = normalizedSearch
      ? orders.filter((order) =>
          getManufacturerOrderSearchHaystack(order).includes(normalizedSearch),
        )
      : orders;

    filteredOrders = sortManufacturerOrders(filteredOrders, sortBy);
    const summary = summarizeManufacturerOrders(filteredOrders);
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
    console.error("Manufacturer orders fetch error:", error);
    return res.status(500).json({
      message: "Unable to load manufacturer orders.",
    });
  }
};

export const getManufacturerOrderById = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      manufacturerAccountId: accountObjectId,
    })
      .populate("userId", "name email phone")
      .populate(
        "items.productId",
        "brandName images genericCompositions manufacturer manufacturerAccountId",
      );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Manufacturer order detail error:", error);
    return res.status(500).json({
      message: "Unable to load order details.",
    });
  }
};

export const updateManufacturerOrderStatus = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      manufacturerAccountId: accountObjectId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const allowedStatuses =
      MANUFACTURER_ORDER_STATUS_TRANSITIONS[order.orderStatus] || [];
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
      .populate(
        "items.productId",
        "brandName images genericCompositions manufacturer manufacturerAccountId",
      );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Manufacturer order status update error:", error);
    return res.status(500).json({
      message: "Unable to update order status.",
    });
  }
};

export const getManufacturerPaymentSummary = async (req, res) => {
  try {
    const accountObjectId = getManufacturerAccountObjectId(req.manufacturer);
    const { from = "", to = "" } = req.query;

    const filter = {
      manufacturerAccountId: accountObjectId,
    };

    if (from && to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $gte: new Date(from),
        $lte: endDate,
      };
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "_id orderId invoiceNumber totalAmount paymentMode paymentStatus orderStatus createdAt deliveredAt items address",
      )
      .populate("userId", "name email phone");

    const summary = summarizeManufacturerOrders(orders);
    summary.averageOrderValue = summary.totalOrders
      ? Number((summary.totalRevenue / summary.totalOrders).toFixed(2))
      : 0;

    const recentOrders = orders.slice(0, 8);

    return res.status(200).json({
      success: true,
      summary,
      filtersApplied: {
        from,
        to,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Manufacturer payment summary error:", error);
    return res.status(500).json({
      message: "Unable to load manufacturer payment summary.",
    });
  }
};
