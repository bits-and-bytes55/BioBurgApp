import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Franchise from "../models/Franchise.js";
import FranchiseAccount from "../models/FranchiseAccount.js";
import FranchiseInventorySetting from "../models/FranchiseInventorySetting.js";
import FranchiseRestockRequest from "../models/FranchiseRestockRequest.js";
import Order from "../models/Order.js";
import jwt from "jsonwebtoken";

/**
 * @desc    Submit Franchise Application (Public)
 * @route   POST /api/franchise/apply
 * @access  Public
 */
export const submitFranchiseForm = async (req, res) => {
  try {
    const franchise = await Franchise.create({
      fullName: req.body.fullName,
      gender: req.body.gender,
      dob: req.body.dob,
      mobile: req.body.mobile,
      email: req.body.email,
      isDoctor: req.body.isDoctor,
      pathyExpertise: req.body.pathyExpertise,
      patientsPerDay: req.body.patientsPerDay,
      agreementRating: req.body.agreementRating,
      additionalSupport: normalizeArrayField(req.body.additionalSupport),
      otherSupportText: req.body.otherSupportText,
      similarBusiness: req.body.similarBusiness,
      concerns: normalizeArrayField(req.body.concerns),
      otherConcernText: req.body.otherConcernText,
      challenges: normalizeArrayField(req.body.challenges),
      otherChallengeText: req.body.otherChallengeText,
      investmentBandwidth: req.body.investmentBandwidth,
      franchiseModel: req.body.franchiseModel,
      investmentTimeline: req.body.investmentTimeline,
      roiExpectation: req.body.roiExpectation,
      investingCapacity: req.body.investingCapacity,
      multipleFranchises: req.body.multipleFranchises,
      numberOfStores: req.body.numberOfStores,
      appealingAspects: normalizeArrayField(req.body.appealingAspects),
      otherAppealingText: req.body.otherAppealingText,
      nearbyPharmacy: req.body.nearbyPharmacy,
      whyBioburg: req.body.whyBioburg,
      legalDisputes: req.body.legalDisputes,
      citiesOfInterest: req.body.citiesOfInterest,
      locality: req.body.locality,
      marketConnect: req.body.marketConnect,
      locationType: req.body.locationType
    });

    return res.status(201).json({
      success: true,
      message: "Franchise application submitted successfully",
      data: franchise,
    });
  } catch (error) {
    console.error("Franchise Apply Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit franchise application",
      error: error.message,
    });
  }
};

export const getAllFranchises = async (req, res) => {
  try {
    const franchises = await Franchise.find()
      .populate("zoneId", "name status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: franchises,
    });
  } catch (error) {
    console.error("Get Franchise Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch franchises",
      error: error.message,
    });
  }
};

export const approveFranchise = async (req, res) => {
  try {
    const { franchiseId, zoneId } = req.body;

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    franchise.status = "APPROVED";
    franchise.zoneId = zoneId;
    await franchise.save();

    const existingAccount = await FranchiseAccount.findOne({
      franchiseApplicationId: franchise._id,
    });

    if (!existingAccount) {
      const hashedPassword = await bcrypt.hash("Temp@123", 10);

      await FranchiseAccount.create({
        franchiseApplicationId: franchise._id,
        email: franchise.email,
        password: hashedPassword,
        zoneId,
        status: "ACTIVE",
      });
    } else {
      existingAccount.zoneId = zoneId;
      existingAccount.email = franchise.email;
      existingAccount.status = "ACTIVE";
      await existingAccount.save();
    }

    res.json({
      success: true,
      message: "Franchise approved and login enabled",
      tempPassword: "Temp@123",
    });
  } catch (error) {
    console.error("Approve Franchise Error:", error);
    res.status(500).json({
      message: "Approval failed",
    });
  }
};

export const getFranchiseDashboard = async (req, res) => {
  try {
    const account = await FranchiseAccount.findById(req.franchise._id)
      .populate("franchiseApplicationId")
      .populate("zoneId", "name pincodes status");

    if (!account) {
      return res.status(404).json({ message: "Franchise account not found" });
    }

    const zoneObjectId = getZoneObjectId(account.zoneId);
    const zoneFilter = zoneObjectId ? { zoneId: zoneObjectId } : null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const trendBuckets = getDayBuckets(7);
    const trendStartDate = new Date(trendBuckets[0].key);

    const [
      metricsRows,
      statusRows,
      trendRows,
      recentOrders,
      supportRows,
      settlementOrders,
      recentSupportTickets,
      inventorySnapshot,
    ] =
      await Promise.all([
        zoneFilter
          ? Order.aggregate([
              { $match: zoneFilter },
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
                  todayOrders: {
                    $sum: {
                      $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0],
                    },
                  },
                  deliveredOrders: {
                    $sum: {
                      $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0],
                    },
                  },
                  cancelledOrders: {
                    $sum: {
                      $cond: [
                        { $in: ["$orderStatus", ["CANCELLED", "REJECTED"]] },
                        1,
                        0,
                      ],
                    },
                  },
                  pendingOrders: {
                    $sum: {
                      $cond: [
                        { $in: ["$orderStatus", PENDING_PIPELINE_STATUSES] },
                        1,
                        0,
                      ],
                    },
                  },
                  activeDeliveries: {
                    $sum: {
                      $cond: [
                        { $in: ["$orderStatus", ACTIVE_DELIVERY_STATUSES] },
                        1,
                        0,
                      ],
                    },
                  },
                  onlineRevenue: {
                    $sum: {
                      $cond: [
                        { $eq: ["$paymentMode", "ONLINE"] },
                        { $ifNull: ["$totalAmount", 0] },
                        0,
                      ],
                    },
                  },
                  codRevenue: {
                    $sum: {
                      $cond: [
                        { $eq: ["$paymentMode", "COD"] },
                        { $ifNull: ["$totalAmount", 0] },
                        0,
                      ],
                    },
                  },
                  paidOrders: {
                    $sum: {
                      $cond: [{ $eq: ["$paymentStatus", "PAID"] }, 1, 0],
                    },
                  },
                  pendingPaymentOrders: {
                    $sum: {
                      $cond: [{ $ne: ["$paymentStatus", "PAID"] }, 1, 0],
                    },
                  },
                  paidAmount: {
                    $sum: {
                      $cond: [
                        { $eq: ["$paymentStatus", "PAID"] },
                        { $ifNull: ["$totalAmount", 0] },
                        0,
                      ],
                    },
                  },
                  pendingAmount: {
                    $sum: {
                      $cond: [
                        { $ne: ["$paymentStatus", "PAID"] },
                        { $ifNull: ["$totalAmount", 0] },
                        0,
                      ],
                    },
                  },
                },
              },
            ])
          : Promise.resolve([]),
        zoneFilter
          ? Order.aggregate([
              { $match: zoneFilter },
              { $group: { _id: "$orderStatus", value: { $sum: 1 } } },
              { $sort: { value: -1, _id: 1 } },
            ])
          : Promise.resolve([]),
        zoneFilter
          ? Order.aggregate([
              {
                $match: {
                  ...zoneFilter,
                  createdAt: { $gte: trendStartDate },
                },
              },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$createdAt",
                    },
                  },
                  sales: { $sum: { $ifNull: ["$totalAmount", 0] } },
                  orders: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ])
          : Promise.resolve([]),
        zoneFilter
          ? Order.find(zoneFilter)
              .sort({ createdAt: -1 })
              .limit(5)
              .populate("userId", "name email")
              .select(
                "_id totalAmount orderStatus paymentMode paymentStatus createdAt address"
              )
          : Promise.resolve([]),
        SupportTicket.aggregate([
          { $match: { franchiseId: account._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        zoneFilter
          ? Order.find(zoneFilter)
              .select(
                "totalAmount paymentMode paymentStatus orderStatus deliveredAt createdAt"
              )
              .lean()
          : Promise.resolve([]),
        SupportTicket.find({ franchiseId: account._id })
          .sort({ updatedAt: -1 })
          .limit(5)
          .select("subject category status createdAt updatedAt")
          .lean(),
        buildFranchiseInventorySnapshot(account),
      ]);

    const metrics = metricsRows[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      todayOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      activeDeliveries: 0,
      onlineRevenue: 0,
      codRevenue: 0,
      paidOrders: 0,
      pendingPaymentOrders: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };

    metrics.averageOrderValue = metrics.totalOrders
      ? Number((metrics.totalRevenue / metrics.totalOrders).toFixed(2))
      : 0;
    metrics.completionRate = metrics.totalOrders
      ? Number(((metrics.deliveredOrders / metrics.totalOrders) * 100).toFixed(1))
      : 0;

    const salesTrend = trendBuckets.map((bucket) => {
      const matchingRow = trendRows.find((row) => row._id === bucket.key);

      return {
        day: bucket.day,
        key: bucket.key,
        sales: matchingRow?.sales || 0,
        orders: matchingRow?.orders || 0,
      };
    });

    const supportSummary = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      total: 0,
    };

    supportRows.forEach((row) => {
      if (row._id === "OPEN") {
        supportSummary.open = row.count;
      }

      if (row._id === "IN_PROGRESS") {
        supportSummary.inProgress = row.count;
      }

      if (row._id === "RESOLVED") {
        supportSummary.resolved = row.count;
      }

      supportSummary.total += row.count;
    });

    const settlementMetrics = computeFranchiseSettlementMetrics(
      settlementOrders,
      account.settlementConfig,
    );
    const lowStockItems = (inventorySnapshot?.inventory || [])
      .filter((item) => ["OUT_OF_STOCK", "LOW_STOCK", "BELOW_TARGET"].includes(item.stockStatus))
      .slice(0, 5)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        currentStock: item.currentStock,
        lowStockThreshold: item.lowStockThreshold,
        targetStock: item.targetStock,
        stockStatus: item.stockStatus,
        recommendedRestockQty: item.recommendedRestockQty,
        activeRestockRequest: item.activeRestockRequest,
      }));
    const recentRestockRequests = (inventorySnapshot?.restockRequests || []).slice(0, 5);
    const alerts = {
      pendingOrders: metrics.pendingOrders || 0,
      openSupportTickets: supportSummary.open || 0,
      lowStockItems: inventorySnapshot?.summary?.lowStockItems || 0,
      outOfStockItems: inventorySnapshot?.summary?.outOfStockItems || 0,
      activeRestockRequests: inventorySnapshot?.summary?.activeRestockRequests || 0,
      pendingCollectionOrders: settlementMetrics.deliveredPendingCollectionOrders || 0,
      netPayoutDue: settlementMetrics.netPayoutDue || 0,
      urgentActions:
        (inventorySnapshot?.summary?.outOfStockItems || 0) +
        (supportSummary.open || 0) +
        ((metrics.pendingOrders || 0) > 0 ? 1 : 0),
    };

    res.json({
      success: true,
      data: {
        account: {
          id: account._id,
          email: account.email,
          status: account.status,
          settlementConfig: settlementMetrics.rules,
          zone: account.zoneId
            ? {
                id: account.zoneId._id,
                name: account.zoneId.name,
                status: account.zoneId.status,
                pincodes: account.zoneId.pincodes || [],
              }
            : null,
          application: account.franchiseApplicationId || null,
        },
        metrics,
        orderStatusData: statusRows.map((row) => ({
          name: row._id || "UNKNOWN",
          value: row.value,
        })),
        salesTrend,
        recentOrders,
        supportSummary,
        recentSupportTickets,
        inventorySummary: inventorySnapshot?.summary || null,
        lowStockItems,
        recentRestockRequests,
        alerts,
        paymentSummary: {
          totalCollections: metrics.totalRevenue,
          paidAmount: metrics.paidAmount,
          pendingAmount: metrics.pendingAmount,
          onlineRevenue: metrics.onlineRevenue,
          codRevenue: metrics.codRevenue,
          paidOrders: metrics.paidOrders,
          pendingPaymentOrders: metrics.pendingPaymentOrders,
          averageOrderValue: metrics.averageOrderValue,
          rules: settlementMetrics.rules,
          settlementEligibleAmount: settlementMetrics.settlementEligibleAmount,
          settlementInHoldAmount: settlementMetrics.settlementInHoldAmount,
          settlementEligibleOrders: settlementMetrics.settlementEligibleOrders,
          settlementInHoldOrders: settlementMetrics.settlementInHoldOrders,
          commissionAmount: settlementMetrics.commissionAmount,
          projectedCommissionAmount: settlementMetrics.projectedCommissionAmount,
          netPayoutDue: settlementMetrics.netPayoutDue,
          projectedNetSettlement: settlementMetrics.projectedNetSettlement,
          belowThresholdAmount: settlementMetrics.belowThresholdAmount,
          deliveredPendingCollection:
            settlementMetrics.deliveredPendingCollection,
          deliveredPendingCollectionOrders:
            settlementMetrics.deliveredPendingCollectionOrders,
          deliveredPaidValue: settlementMetrics.deliveredPaidValue,
          holdCutoffDate: settlementMetrics.holdCutoffDate,
        },
      },
    });
  } catch (error) {
    console.error("Franchise Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getFranchiseOrders = async (req, res) => {
  try {
    const { status, paymentMode, paymentStatus, search, from, to, sortBy = "newest" } =
      req.query;
    const zoneObjectId = getZoneObjectId(req.franchise.zoneId);

    if (!zoneObjectId) {
      return res.status(400).json({
        message: "Franchise zone not assigned",
      });
    }

    const filter = {
      zoneId: zoneObjectId,
    };

    if (status && status !== "ALL") {
      filter.orderStatus = status;
    }

    if (paymentMode && paymentMode !== "ALL") {
      filter.paymentMode = paymentMode;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      filter.paymentStatus = paymentStatus;
    }

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        filter.createdAt.$gte = new Date(from);
      }

      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone")
      .populate(ORDER_PRODUCT_POPULATE);

    const invoiceUpdatePromises = [];
    orders.forEach((order) => {
      if (ensureFranchiseInvoiceMetadata(order)) {
        invoiceUpdatePromises.push(order.save());
      }
    });

    if (invoiceUpdatePromises.length > 0) {
      await Promise.all(invoiceUpdatePromises);
    }

    const normalizedSearch = normalizeSearchValue(search);
    let filteredOrders = normalizedSearch
      ? orders.filter((order) => getOrderSearchHaystack(order).includes(normalizedSearch))
      : orders;

    filteredOrders = sortFranchiseOrders(filteredOrders, sortBy);
    const summary = summarizeFranchiseOrders(filteredOrders);

    res.json({
      success: true,
      count: filteredOrders.length,
      summary,
      filtersApplied: {
        status: status || "ALL",
        paymentMode: paymentMode || "ALL",
        paymentStatus: paymentStatus || "ALL",
        search: search || "",
        from: from || "",
        to: to || "",
        sortBy,
      },
      orders: filteredOrders,
    });
  } catch (error) {
    console.error("Franchise Orders Error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getFranchiseOrderDetails = async (req, res) => {
  try {
    const zoneObjectId = getZoneObjectId(req.franchise.zoneId);

    if (!zoneObjectId) {
      return res.status(400).json({ message: "Franchise zone not assigned" });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      zoneId: zoneObjectId,
    })
      .populate("userId", "name email phone")
      .populate(ORDER_PRODUCT_POPULATE);

    if (!order) {
      return res.status(404).json({
        message: "Order not found for your zone",
      });
    }

    if (ensureFranchiseInvoiceMetadata(order)) {
      await order.save();
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Franchise Order Details Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFranchiseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.zoneId) {
      return res.status(400).json({
        message: "Order has no zone assigned. Contact admin.",
      });
    }

    if (!req.franchise?.zoneId) {
      return res.status(401).json({
        message: "Franchise zone missing",
      });
    }

    if (String(order.zoneId) !== String(req.franchise.zoneId)) {
      return res.status(403).json({
        message: "Unauthorized franchise",
      });
    }

    const allowedStatuses = VALID_STATUS_TRANSITIONS[order.orderStatus] || [];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot move order from ${order.orderStatus} to ${status}`,
      });
    }

    order.orderStatus = status;
    order.trackingHistory.push({
      status,
      time: new Date(),
    });

    if (status === "DELIVERED") {
      order.deliveredAt = new Date();
    }

    ensureFranchiseInvoiceMetadata(order);

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Order Status Update Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const franchiseSalesSummary = async (req, res) => {
  try {
    const zoneObjectId = getZoneObjectId(req.franchise.zoneId);

    if (!zoneObjectId) {
      return res.json({
        success: true,
        totalOrders: 0,
        totalSales: 0,
        codSales: 0,
        onlineSales: 0,
        averageOrderValue: 0,
      });
    }

    const rows = await Order.aggregate([
      { $match: { zoneId: zoneObjectId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: { $ifNull: ["$totalAmount", 0] } },
          codSales: {
            $sum: {
              $cond: [
                { $eq: ["$paymentMode", "COD"] },
                { $ifNull: ["$totalAmount", 0] },
                0,
              ],
            },
          },
          onlineSales: {
            $sum: {
              $cond: [
                { $eq: ["$paymentMode", "ONLINE"] },
                { $ifNull: ["$totalAmount", 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const summary = rows[0] || {
      totalOrders: 0,
      totalSales: 0,
      codSales: 0,
      onlineSales: 0,
    };

    summary.averageOrderValue = summary.totalOrders
      ? Number((summary.totalSales / summary.totalOrders).toFixed(2))
      : 0;

    res.json({
      success: true,
      ...summary,
    });
  } catch (err) {
    console.error("Sales Summary Error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const franchiseSettlementSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const zoneObjectId = getZoneObjectId(req.franchise.zoneId);

    if (!zoneObjectId) {
      const metrics = computeFranchiseSettlementMetrics([], req.franchise.settlementConfig);
      return res.json({
        success: true,
        summary: {
          totalCollections: 0,
          paidAmount: 0,
          pendingAmount: 0,
          onlineRevenue: 0,
          codRevenue: 0,
          paidOrders: 0,
          pendingPaymentOrders: 0,
          averageOrderValue: 0,
          ...metrics,
        },
      });
    }

    const filter = { zoneId: zoneObjectId };
    if (from && to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $gte: new Date(from),
        $lte: endDate,
      };
    }

    const orders = await Order.find(filter)
      .select("totalAmount paymentMode paymentStatus orderStatus deliveredAt createdAt")
      .lean();
    const metrics = computeFranchiseSettlementMetrics(
      orders,
      req.franchise.settlementConfig,
    );

    res.json({
      success: true,
      summary: {
        totalCollections: metrics.grossSales,
        paidAmount: metrics.paidAmount,
        pendingAmount: Math.max(metrics.grossSales - metrics.paidAmount, 0),
        onlineRevenue: metrics.onlineCollected,
        codRevenue: metrics.codOrderValue,
        paidOrders: metrics.deliveredPaidOrders,
        pendingPaymentOrders: metrics.deliveredPendingCollectionOrders,
        averageOrderValue: metrics.totalOrders
          ? Number((metrics.grossSales / metrics.totalOrders).toFixed(2))
          : 0,
        ...metrics,
      },
    });
  } catch (err) {
    console.error("Franchise Settlement Summary Error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const franchiseSalesReport = async (req, res) => {
  try {
    const {
      from,
      to,
      status,
      paymentMode,
      paymentStatus,
      search,
      sortBy = "newest",
    } = req.query;
    const zoneObjectId = getZoneObjectId(req.franchise.zoneId);

    if (!zoneObjectId) {
      return res.json({
        success: true,
        count: 0,
        summary: summarizeFranchiseOrders([]),
        filtersApplied: {
          status: status || "ALL",
          paymentMode: paymentMode || "ALL",
          paymentStatus: paymentStatus || "ALL",
          search: search || "",
          from: from || "",
          to: to || "",
          sortBy,
        },
        orders: [],
      });
    }

    const filter = {
      zoneId: zoneObjectId,
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
      .populate("zoneId", "name");

    const invoiceUpdatePromises = [];
    orders.forEach((order) => {
      if (ensureFranchiseInvoiceMetadata(order)) {
        invoiceUpdatePromises.push(order.save());
      }
    });

    if (invoiceUpdatePromises.length > 0) {
      await Promise.all(invoiceUpdatePromises);
    }

    const normalizedSearch = normalizeSearchValue(search);
    let filteredOrders = normalizedSearch
      ? orders.filter((order) => getOrderSearchHaystack(order).includes(normalizedSearch))
      : orders;

    filteredOrders = sortFranchiseOrders(filteredOrders, sortBy);
    const summary = summarizeFranchiseOrders(filteredOrders);

    res.json({
      success: true,
      count: filteredOrders.length,
      summary,
      filtersApplied: {
        status: status || "ALL",
        paymentMode: paymentMode || "ALL",
        paymentStatus: paymentStatus || "ALL",
        search: search || "",
        from: from || "",
        to: to || "",
        sortBy,
      },
      orders: filteredOrders,
    });
  } catch (err) {
    console.error("Sales Report Error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFranchiseProducts = async (req, res) => {
  try {
    const zoneObjectId = requireFranchiseZoneObjectId(req, res);
    if (!zoneObjectId) {
      return;
    }

    const { search = "", section = "ALL", status = "ALL", category = "" } = req.query;
    const filter = { franchiseZoneId: zoneObjectId };
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

    const [products, zoneSections] = await Promise.all([
      Product.find(filter)
        .populate("category", "title")
        .populate("subCategory", "title")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      Product.distinct("sections", { franchiseZoneId: zoneObjectId }),
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
          product.sections.forEach((sectionName) => accumulator.sectionSet.add(sectionName));
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

    const availableSections = [...new Set([...(zoneSections || []), ...summary.sectionSet])].sort((left, right) =>
      left.localeCompare(right),
    );
    delete summary.sectionSet;
    summary.totalSections = availableSections.length;

    res.json({
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
  } catch (err) {
    console.error("Franchise Products Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const searchFranchiseProducts = async (req, res) => {
  try {
    const zoneObjectId = requireFranchiseZoneObjectId(req, res);
    if (!zoneObjectId) {
      return;
    }

    const query = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

    if (!query) {
      return res.json({ success: true, products: [] });
    }

    const regex = new RegExp(query, "i");
    const products = await Product.find({
      franchiseZoneId: zoneObjectId,
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

    res.json({ success: true, products });
  } catch (err) {
    console.error("Search Franchise Products Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getFranchiseProductById = async (req, res) => {
  try {
    const zoneObjectId = requireFranchiseZoneObjectId(req, res);
    if (!zoneObjectId) {
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findOne({
      _id: id,
      franchiseZoneId: zoneObjectId,
    })
      .populate("category", "title")
      .populate("subCategory", "title");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error("Get Franchise Product Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const createFranchiseProduct = async (req, res) => {
  try {
    const zoneObjectId = requireFranchiseZoneObjectId(req, res);
    if (!zoneObjectId) {
      return;
    }

    const nextFields = await buildProductFields(
      {
        ...(req.body || {}),
        franchiseZoneId: zoneObjectId,
      },
      { requireCategory: true },
    );

    const product = new Product(nextFields);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "title")
      .populate("subCategory", "title");

    res.status(201).json({
      success: true,
      message: "Product saved successfully",
      product: populatedProduct,
    });
  } catch (err) {
    console.error("Create Franchise Product Error:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to save product" });
  }
};

export const updateFranchiseProduct = async (req, res) => {
  try {
    const zoneObjectId = requireFranchiseZoneObjectId(req, res);
    if (!zoneObjectId) {
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findOne({
      _id: id,
      franchiseZoneId: zoneObjectId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const nextFields = await buildProductFields(
      {
        ...(req.body || {}),
        franchiseZoneId: zoneObjectId,
      },
      { existingProduct: product },
    );

    await cleanupChangedProductAssets(product, nextFields, req.body || {});

    Object.assign(product, nextFields);
    product.franchiseZoneId = zoneObjectId;
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "title")
      .populate("subCategory", "title");

    res.json({
      success: true,
      message: "Product updated successfully",
      product: populatedProduct,
    });
  } catch (err) {
    console.error("Update Franchise Product Error:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to update product" });
  }
};

export const deleteFranchiseProduct = async (req, res) => {
  try {
    const zoneObjectId = requireFranchiseZoneObjectId(req, res);
    if (!zoneObjectId) {
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findOne({
      _id: id,
      franchiseZoneId: zoneObjectId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingOrder = await Order.exists({ "items.productId": product._id });
    if (existingOrder) {
      return res.status(400).json({
        message:
          "This product is already part of franchise orders. Edit the product instead of deleting it.",
      });
    }

    await destroyProductAssets(product);
    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Delete Franchise Product Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getFranchiseInventory = async (req, res) => {
  try {
    const snapshot = await buildFranchiseInventorySnapshot(req.franchise);

    res.json({
      success: true,
      count: snapshot.inventory.length,
      summary: snapshot.summary,
      inventory: snapshot.inventory,
      restockRequests: snapshot.restockRequests,
    });
  } catch (err) {
    console.error("Franchise Inventory Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateFranchiseInventorySettings = async (req, res) => {
  try {
    const zoneObjectId = getZoneObjectId(req.franchise.zoneId);

    if (!zoneObjectId) {
      return res.status(400).json({ message: "Franchise zone not assigned" });
    }

    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(productId)
      .select("brandName genericName totalStocks stocks")
      .lean();

    const lowStockThreshold = parseNonNegativeNumber(req.body.lowStockThreshold, 10);
    const targetStock = parseNonNegativeNumber(
      req.body.targetStock,
      Math.max(lowStockThreshold * 2, lowStockThreshold + 15),
    );
    const currentStock = parseNonNegativeNumber(
      req.body.currentStock,
      parseNonNegativeNumber(product?.totalStocks ?? product?.stocks, 0),
    );
    const preferredRestockQty = parseNonNegativeNumber(
      req.body.preferredRestockQty,
      Math.max(targetStock - currentStock, 0),
    );

    const setting = await FranchiseInventorySetting.findOneAndUpdate(
      {
        franchiseAccountId: req.franchise._id,
        productId,
      },
      {
        franchiseAccountId: req.franchise._id,
        zoneId: zoneObjectId,
        productId,
        productName: req.body.productName || getProductDisplayName(product),
        currentStock,
        lowStockThreshold,
        targetStock,
        preferredRestockQty,
        notes: normalizeInventoryNotes(req.body.notes),
        lastUpdatedBy: req.franchise.email || "franchise",
        lastUpdatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const snapshot = await buildFranchiseInventorySnapshot(req.franchise);
    const inventoryItem =
      snapshot.inventory.find((item) => String(item.productId) === String(productId)) ||
      null;

    res.json({
      success: true,
      message: "Inventory settings updated",
      setting,
      inventoryItem,
    });
  } catch (err) {
    console.error("Update Franchise Inventory Settings Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getFranchiseRestockRequests = async (req, res) => {
  try {
    const filter = {
      franchiseAccountId: req.franchise._id,
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await FranchiseRestockRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const summary = requests.reduce(
      (accumulator, request) => {
        accumulator.total += 1;
        accumulator[request.status] = (accumulator[request.status] || 0) + 1;
        return accumulator;
      },
      { total: 0 },
    );

    res.json({
      success: true,
      summary,
      requests,
    });
  } catch (err) {
    console.error("Get Franchise Restock Requests Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const createFranchiseRestockRequest = async (req, res) => {
  try {
    const zoneObjectId = getZoneObjectId(req.franchise.zoneId);

    if (!zoneObjectId) {
      return res.status(400).json({ message: "Franchise zone not assigned" });
    }

    const { productId } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingOpenRequest = await FranchiseRestockRequest.findOne({
      franchiseAccountId: req.franchise._id,
      productId,
      status: { $in: OPEN_RESTOCK_REQUEST_STATUSES },
    }).lean();

    if (existingOpenRequest) {
      return res.status(400).json({
        message: "An open restock request already exists for this product",
      });
    }

    const snapshot = await buildFranchiseInventorySnapshot(req.franchise);
    const inventoryItem = snapshot.inventory.find(
      (item) => String(item.productId) === String(productId),
    );

    const product = !inventoryItem
      ? await Product.findById(productId)
          .select("brandName genericName totalStocks stocks")
          .lean()
      : null;

    const currentStock = parseNonNegativeNumber(
      req.body.currentStock,
      inventoryItem?.currentStock ??
        parseNonNegativeNumber(product?.totalStocks ?? product?.stocks, 0),
    );
    const lowStockThreshold = parseNonNegativeNumber(
      req.body.lowStockThreshold,
      inventoryItem?.lowStockThreshold ?? 10,
    );
    const targetStock = parseNonNegativeNumber(
      req.body.targetStock,
      inventoryItem?.targetStock ?? Math.max(lowStockThreshold * 2, lowStockThreshold + 15),
    );
    const preferredRestockQty = parseNonNegativeNumber(
      req.body.preferredRestockQty,
      inventoryItem?.preferredRestockQty ?? Math.max(targetStock - currentStock, 0),
    );
    const requestedQty = parseNonNegativeNumber(
      req.body.requestedQty,
      inventoryItem?.recommendedRestockQty || preferredRestockQty,
    );

    if (!requestedQty || requestedQty < 1) {
      return res.status(400).json({ message: "Requested quantity must be at least 1" });
    }

    const priority = RESTOCK_PRIORITIES.includes(req.body.priority)
      ? req.body.priority
      : getRestockPriority(currentStock, lowStockThreshold, requestedQty);

    await FranchiseInventorySetting.findOneAndUpdate(
      {
        franchiseAccountId: req.franchise._id,
        productId,
      },
      {
        franchiseAccountId: req.franchise._id,
        zoneId: zoneObjectId,
        productId,
        productName:
          req.body.productName ||
          inventoryItem?.productName ||
          getProductDisplayName(product),
        currentStock,
        lowStockThreshold,
        targetStock,
        preferredRestockQty,
        notes: normalizeInventoryNotes(req.body.notes),
        lastUpdatedBy: req.franchise.email || "franchise",
        lastUpdatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const request = await FranchiseRestockRequest.create({
      franchiseAccountId: req.franchise._id,
      franchiseApplicationId: req.franchise.franchiseApplicationId || null,
      zoneId: zoneObjectId,
      productId,
      productName:
        req.body.productName ||
        inventoryItem?.productName ||
        getProductDisplayName(product),
      currentStock,
      lowStockThreshold,
      targetStock,
      requestedQty,
      priority,
      requestNote: normalizeInventoryNotes(req.body.requestNote),
      requestedBy: req.franchise.email || "franchise",
    });

    res.status(201).json({
      success: true,
      message: "Restock request created successfully",
      request,
    });
  } catch (err) {
    console.error("Create Franchise Restock Request Error:", err);
    res.status(500).json({ message: err.message });
  }
};
