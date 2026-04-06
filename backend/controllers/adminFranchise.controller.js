import bcrypt from "bcryptjs";
import Franchise from "../models/Franchise.js";
import FranchiseAccount from "../models/FranchiseAccount.js";
import FranchiseInventorySetting from "../models/FranchiseInventorySetting.js";
import FranchiseRestockRequest from "../models/FranchiseRestockRequest.js";
import Order from "../models/Order.js";
import Zone from "../models/Zone.js";
import {
  computeFranchiseSettlementMetrics,
  normalizeFranchiseSettlementConfig,
} from "../utils/franchiseSettlement.js";

const VALID_KYC_STATUSES = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"];
const VALID_REVIEW_STATUSES = ["PENDING", "REJECTED"];
const VALID_ADMIN_RESTOCK_STATUSES = [
  "PENDING",
  "APPROVED",
  "IN_PROGRESS",
  "FULFILLED",
  "REJECTED",
];
const FINAL_RESTOCK_STATUSES = ["FULFILLED", "REJECTED", "CANCELLED"];

const getActorName = (req) => req.admin?.username || req.user?.username || "Admin";
const normalizeObjectId = (value) => String(value?._id || value || "");

const pushLifecycleNote = (franchise, req, action, note) => {
  const trimmedNote = String(note || "").trim();

  if (!action && !trimmedNote) {
    return;
  }

  franchise.lifecycleNotes = franchise.lifecycleNotes || [];
  franchise.lifecycleNotes.push({
    action,
    note: trimmedNote,
    actor: getActorName(req),
    createdAt: new Date(),
  });
};

const pushZoneHistory = (franchise, req, zone, note) => {
  const trimmedNote = String(note || "").trim();
  const previousZoneId = normalizeObjectId(franchise.zoneId);
  const nextZoneId = normalizeObjectId(zone?._id || zone);
  const hasZoneChanged = previousZoneId !== nextZoneId;

  if (!hasZoneChanged && franchise.status === "APPROVED" && !trimmedNote) {
    return null;
  }

  const action = previousZoneId
    ? hasZoneChanged
      ? "REASSIGNED"
      : "RECONFIRMED"
    : "ASSIGNED";

  franchise.zoneHistory = franchise.zoneHistory || [];
  franchise.zoneHistory.push({
    zoneId: zone._id,
    zoneName: zone.name || "",
    action,
    note: trimmedNote,
    assignedBy: getActorName(req),
    assignedAt: new Date(),
  });

  return action;
};

const buildOrderMetrics = (orders = []) =>
  orders.reduce(
    (accumulator, order) => {
      accumulator.totalOrders += 1;
      accumulator.grossSales += Number(order.totalAmount || 0);

      if (order.orderStatus === "DELIVERED") {
        accumulator.deliveredOrders += 1;
      } else if (!["CANCELLED", "REJECTED"].includes(order.orderStatus)) {
        accumulator.pendingOrders += 1;
      }

      if (order.paymentStatus === "PAID") {
        accumulator.paidOrders += 1;
      }

      return accumulator;
    },
    {
      totalOrders: 0,
      deliveredOrders: 0,
      pendingOrders: 0,
      paidOrders: 0,
      grossSales: 0,
    },
  );

/**
 * GET ALL FRANCHISE APPLICATIONS
 */
export const getAllFranchiseRequests = async (req, res) => {
  const franchises = await Franchise.find()
    .populate("zoneId", "name")
    .populate("zoneHistory.zoneId", "name status pincodes")
    .sort({ createdAt: -1 });

  res.json({ success: true, franchises });
};

export const updateFranchiseKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { kycStatus, kycNotes } = req.body;

    if (!VALID_KYC_STATUSES.includes(kycStatus)) {
      return res.status(400).json({ message: "Invalid KYC status" });
    }

    const franchise = await Franchise.findById(id);

    if (!franchise) {
      return res.status(404).json({ message: "Franchise request not found" });
    }

    const previousStatus = franchise.kycStatus || "PENDING";
    const previousNotes = franchise.kycNotes || "";
    const nextNotes = String(kycNotes || "").trim();

    franchise.kycStatus = kycStatus;
    franchise.kycNotes = nextNotes;

    if (previousStatus !== kycStatus || previousNotes !== nextNotes) {
      const noteParts = [`KYC status changed from ${previousStatus} to ${kycStatus}`];
      if (nextNotes) {
        noteParts.push(nextNotes);
      }
      pushLifecycleNote(franchise, req, "KYC_UPDATED", noteParts.join(". "));
    }

    await franchise.save();

    res.json({ success: true, franchise });
  } catch (err) {
    console.error("Update Franchise KYC Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFranchiseReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, lifecycleNote } = req.body;

    if (status && !VALID_REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const franchise = await Franchise.findById(id);
    if (!franchise) {
      return res.status(404).json({ message: "Franchise request not found" });
    }

    const trimmedRejectionReason = String(rejectionReason || "").trim();
    const trimmedLifecycleNote = String(lifecycleNote || "").trim();
    const nextStatus = status || franchise.status;

    if (nextStatus === "REJECTED" && !trimmedRejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    if (nextStatus === "REJECTED" && franchise.status !== "REJECTED") {
      const linkedAccount = await FranchiseAccount.findOne({
        franchiseApplicationId: franchise._id,
      });

      if (linkedAccount) {
        linkedAccount.status = "INACTIVE";
        await linkedAccount.save();
      }
    }

    const previousStatus = franchise.status;
    franchise.status = nextStatus;
    franchise.rejectionReason = nextStatus === "REJECTED" ? trimmedRejectionReason : "";

    if (nextStatus === "REJECTED") {
      franchise.kycStatus = "REJECTED";
      pushLifecycleNote(
        franchise,
        req,
        "REJECTED",
        [
          previousStatus !== "REJECTED"
            ? `Application status changed from ${previousStatus} to REJECTED`
            : "Application rejection note updated",
          trimmedRejectionReason,
          trimmedLifecycleNote,
        ]
          .filter(Boolean)
          .join(". "),
      );
    } else if (trimmedLifecycleNote) {
      pushLifecycleNote(franchise, req, "REVIEW_NOTE", trimmedLifecycleNote);
    }

    await franchise.save();

    res.json({ success: true, franchise });
  } catch (err) {
    console.error("Update Franchise Review Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveFranchiseRequest = async (req, res) => {
  try {
    const { franchiseId, zoneId, lifecycleNote } = req.body;

    if (!franchiseId || !zoneId) {
      return res.status(400).json({ message: "Franchise and zone are required" });
    }

    const [franchise, zone] = await Promise.all([
      Franchise.findById(franchiseId),
      Zone.findById(zoneId),
    ]);

    if (!franchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    const zoneHistoryAction = pushZoneHistory(franchise, req, zone, lifecycleNote);

    franchise.status = "APPROVED";
    franchise.zoneId = zone._id;
    franchise.rejectionReason = "";

    const existingAccount = await FranchiseAccount.findOne({
      franchiseApplicationId: franchise._id,
    });

    let tempPassword = null;
    let accountCreated = false;

    if (!existingAccount) {
      tempPassword = "Temp@123";
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await FranchiseAccount.create({
        franchiseApplicationId: franchise._id,
        email: franchise.email,
        password: hashedPassword,
        zoneId: zone._id,
        status: "ACTIVE",
      });
      accountCreated = true;
    } else {
      existingAccount.zoneId = zone._id;
      existingAccount.email = franchise.email;
      existingAccount.status = "ACTIVE";
      existingAccount.resetPasswordOtp = undefined;
      existingAccount.resetPasswordExpire = undefined;
      await existingAccount.save();
    }

    pushLifecycleNote(
      franchise,
      req,
      "APPROVED",
      [
        zoneHistoryAction === "REASSIGNED"
          ? `Application approved and reassigned to zone ${zone.name}`
          : zoneHistoryAction === "RECONFIRMED"
            ? `Application approval reviewed for zone ${zone.name}`
            : `Application approved and mapped to zone ${zone.name}`,
        lifecycleNote,
        accountCreated
          ? "Franchise login created with temporary password Temp@123"
          : "Existing franchise login reactivated",
      ]
        .filter(Boolean)
        .join(". "),
    );

    await franchise.save();

    res.json({
      success: true,
      message: accountCreated
        ? "Franchise approved and login created"
        : "Franchise approved and login reactivated",
      tempPassword,
      franchise,
    });
  } catch (err) {
    console.error("Approve Franchise Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL FRANCHISE ACCOUNTS
 */
export const getAllFranchiseAccounts = async (req, res) => {
  const accounts = await FranchiseAccount.find()
    .populate("franchiseApplicationId", "fullName mobile email")
    .populate("zoneId", "name");

  res.json({ success: true, accounts });
};

export const getAdminFranchiseZoneOverview = async (req, res) => {
  try {
    const [zones, accounts, requests, orders] = await Promise.all([
      Zone.find().sort({ name: 1 }).lean(),
      FranchiseAccount.find()
        .populate("franchiseApplicationId", "fullName mobile email status")
        .populate("zoneId", "name status pincodes")
        .lean(),
      Franchise.find().populate("zoneId", "name status pincodes").lean(),
      Order.find()
        .select("zoneId totalAmount orderStatus paymentStatus createdAt")
        .lean(),
    ]);

    const zoneOrderMap = new Map();
    let ordersWithoutZone = 0;

    orders.forEach((order) => {
      const zoneId = normalizeObjectId(order.zoneId);

      if (!zoneId) {
        ordersWithoutZone += 1;
        return;
      }

      const currentOrders = zoneOrderMap.get(zoneId) || [];
      currentOrders.push(order);
      zoneOrderMap.set(zoneId, currentOrders);
    });

    const zoneSummaries = zones.map((zone) => {
      const zoneId = normalizeObjectId(zone._id);
      const zoneAccounts = accounts.filter(
        (account) => normalizeObjectId(account.zoneId?._id || account.zoneId) === zoneId,
      );
      const zoneRequests = requests.filter(
        (request) => normalizeObjectId(request.zoneId?._id || request.zoneId) === zoneId,
      );
      const zoneOrders = zoneOrderMap.get(zoneId) || [];
      const metrics = buildOrderMetrics(zoneOrders);

      return {
        _id: zone._id,
        name: zone.name,
        status: zone.status,
        pincodes: zone.pincodes || [],
        pincodeCount: (zone.pincodes || []).length,
        assignedAccounts: zoneAccounts.length,
        activeAccounts: zoneAccounts.filter((account) => account.status === "ACTIVE").length,
        blockedAccounts: zoneAccounts.filter((account) => account.status !== "ACTIVE").length,
        approvedRequests: zoneRequests.filter((request) => request.status === "APPROVED").length,
        pendingRequests: zoneRequests.filter((request) => request.status === "PENDING").length,
        rejectedRequests: zoneRequests.filter((request) => request.status === "REJECTED").length,
        ...metrics,
      };
    });

    const accountRows = accounts.map((account) => {
      const zoneId = normalizeObjectId(account.zoneId?._id || account.zoneId);
      const zoneOrders = zoneOrderMap.get(zoneId) || [];
      const metrics = buildOrderMetrics(zoneOrders);

      return {
        _id: account._id,
        email: account.email,
        status: account.status,
        zoneId,
        zoneName: account.zoneId?.name || "",
        franchiseName: account.franchiseApplicationId?.fullName || "Franchise",
        mobile: account.franchiseApplicationId?.mobile || "",
        requestStatus: account.franchiseApplicationId?.status || "APPROVED",
        totalOrders: metrics.totalOrders,
        deliveredOrders: metrics.deliveredOrders,
        grossSales: metrics.grossSales,
      };
    });

    const summary = {
      totalZones: zoneSummaries.length,
      activeZones: zoneSummaries.filter((zone) => zone.status === "ACTIVE").length,
      mappedAccounts: accounts.filter((account) => Boolean(account.zoneId)).length,
      unmappedAccounts: accounts.filter((account) => !account.zoneId).length,
      activeAccounts: accounts.filter((account) => account.status === "ACTIVE").length,
      blockedAccounts: accounts.filter((account) => account.status !== "ACTIVE").length,
      pendingRequests: requests.filter((request) => request.status === "PENDING").length,
      approvedRequests: requests.filter((request) => request.status === "APPROVED").length,
      totalOrders: orders.length,
      ordersWithoutZone,
    };

    res.json({
      success: true,
      summary,
      zones: zoneSummaries,
      accounts: accountRows,
      pendingRequests: requests
        .filter((request) => request.status === "PENDING")
        .map((request) => ({
          _id: request._id,
          fullName: request.fullName,
          email: request.email,
          mobile: request.mobile,
          citiesOfInterest: request.citiesOfInterest,
          zoneId: normalizeObjectId(request.zoneId?._id || request.zoneId),
        })),
    });
  } catch (err) {
    console.error("Admin Franchise Zone Overview Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const reassignFranchiseAccountZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { zoneId, lifecycleNote } = req.body;

    if (!zoneId) {
      return res.status(400).json({ message: "Zone is required" });
    }

    const [account, zone] = await Promise.all([
      FranchiseAccount.findById(id),
      Zone.findById(zoneId),
    ]);

    if (!account) {
      return res.status(404).json({ message: "Franchise account not found" });
    }

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    const previousZoneId = normalizeObjectId(account.zoneId);
    account.zoneId = zone._id;
    await account.save();

    await Promise.all([
      FranchiseInventorySetting.updateMany(
        { franchiseAccountId: account._id },
        { $set: { zoneId: zone._id } },
      ),
      FranchiseRestockRequest.updateMany(
        {
          franchiseAccountId: account._id,
          status: { $in: VALID_ADMIN_RESTOCK_STATUSES.filter((status) => !FINAL_RESTOCK_STATUSES.includes(status)) },
        },
        { $set: { zoneId: zone._id } },
      ),
    ]);

    if (account.franchiseApplicationId) {
      const franchise = await Franchise.findById(account.franchiseApplicationId);

      if (franchise) {
        const zoneAction = pushZoneHistory(franchise, req, zone, lifecycleNote);
        franchise.zoneId = zone._id;
        pushLifecycleNote(
          franchise,
          req,
          "ZONE_MAPPING_UPDATED",
          [
            previousZoneId && previousZoneId !== normalizeObjectId(zone._id)
              ? `Franchise zone changed to ${zone.name}`
              : `Franchise zone confirmed as ${zone.name}`,
            zoneAction ? `Zone history action ${zoneAction}` : "",
            lifecycleNote,
          ]
            .filter(Boolean)
            .join(". "),
        );
        await franchise.save();
      }
    }

    const updatedAccount = await FranchiseAccount.findById(account._id)
      .populate("franchiseApplicationId", "fullName mobile email status")
      .populate("zoneId", "name status pincodes");

    res.json({
      success: true,
      message:
        previousZoneId && previousZoneId !== normalizeObjectId(zone._id)
          ? "Franchise zone reassigned successfully"
          : "Franchise zone confirmed successfully",
      account: updatedAccount,
    });
  } catch (err) {
    console.error("Reassign Franchise Account Zone Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFranchiseSettlementConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await FranchiseAccount.findById(id);

    if (!account) {
      return res.status(404).json({ message: "Franchise account not found" });
    }

    const settlementConfig = normalizeFranchiseSettlementConfig(req.body);
    account.settlementConfig = {
      ...settlementConfig,
      lastUpdatedAt: new Date(),
    };
    await account.save();

    const franchise = await Franchise.findById(account.franchiseApplicationId);
    if (franchise) {
      pushLifecycleNote(
        franchise,
        req,
        "SETTLEMENT_RULES_UPDATED",
        `Settlement rules updated to ${settlementConfig.commissionRate}% commission, ${settlementConfig.settlementHoldDays} hold days, minimum payout ${settlementConfig.minimumPayoutAmount}. ${settlementConfig.settlementNotes}`.trim(),
      );
      await franchise.save();
    }

    res.json({
      success: true,
      message: "Settlement rules updated successfully",
      account,
    });
  } catch (err) {
    console.error("Update Franchise Settlement Config Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleFranchiseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const franchise = await FranchiseAccount.findById(id);
    if (!franchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    franchise.status = status;
    await franchise.save();

    res.json({ success: true, message: `Franchise ${status}`, franchise });
  } catch (err) {
    console.error("Block Franchise Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminFranchiseOrders = async (req, res) => {
  try {
    const franchiseAccounts = await FranchiseAccount.find({ zoneId: { $ne: null } });
    const zoneIds = franchiseAccounts.map((franchiseAccount) => franchiseAccount.zoneId);

    const orders = await Order.find({ zoneId: { $in: zoneIds } })
      .populate("userId", "name email")
      .populate("zoneId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Admin Franchise Orders Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET FRANCHISE REPORT SUMMARY (Admin)
 * Fetches all orders belonging to franchise zones
 */
export const getFranchiseReportSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const franchiseAccounts = await FranchiseAccount.find({ zoneId: { $ne: null } });
    const zoneIds = franchiseAccounts.map((franchiseAccount) => franchiseAccount.zoneId);
    const filter = { zoneId: { $in: zoneIds } };

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    }

    const orders = await Order.find(filter);

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const codSales = orders
      .filter((order) => order.paymentMode === "COD")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const onlineSales = orders
      .filter((order) => order.paymentMode === "ONLINE")
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    res.json({ totalOrders, totalSales, codSales, onlineSales });
  } catch (err) {
    console.error("Franchise Report Summary Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET FRANCHISE SALES REPORT (Admin)
 * Optional query params: from, to (date strings)
 */
export const getFranchiseReportSales = async (req, res) => {
  try {
    const { from, to } = req.query;

    const franchiseAccounts = await FranchiseAccount.find({ zoneId: { $ne: null } });
    const zoneIds = franchiseAccounts.map((franchiseAccount) => franchiseAccount.zoneId);

    const filter = { zoneId: { $in: zoneIds } };

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    }

    const orders = await Order.find(filter)
      .populate("userId", "name email")
      .populate("zoneId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Franchise Report Sales Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFranchiseSettlementSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    const accounts = await FranchiseAccount.find({ zoneId: { $ne: null } })
      .populate("franchiseApplicationId", "fullName email mobile")
      .populate("zoneId", "name")
      .lean();
    const zoneIds = accounts.map((account) => account.zoneId?._id || account.zoneId).filter(Boolean);

    if (zoneIds.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalFranchiseAccounts: 0,
          activeAccounts: 0,
          blockedAccounts: 0,
          mappedZones: 0,
          totalOrders: 0,
          deliveredOrders: 0,
          grossSales: 0,
          paidAmount: 0,
          onlineCollected: 0,
          codOrderValue: 0,
          settlementReadyValue: 0,
          settlementEligibleAmount: 0,
          settlementInHoldAmount: 0,
          commissionAmount: 0,
          projectedCommissionAmount: 0,
          netPayoutDue: 0,
          projectedNetSettlement: 0,
          belowThresholdAmount: 0,
          deliveredPendingCollection: 0,
          openOrderValue: 0,
          cancelledValue: 0,
        },
        settlements: [],
      });
    }

    const orderFilter = { zoneId: { $in: zoneIds } };
    if (from && to) {
      orderFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    }

    const orders = await Order.find(orderFilter)
      .select("zoneId totalAmount paymentMode paymentStatus orderStatus deliveredAt createdAt")
      .lean();
    const orderMap = new Map();

    for (const order of orders) {
      const zoneId = String(order.zoneId || "");
      const existingOrders = orderMap.get(zoneId) || [];
      existingOrders.push(order);
      orderMap.set(zoneId, existingOrders);
    }

    const settlements = accounts.map((account) => {
      const zoneId = String(account.zoneId?._id || account.zoneId);
      const zoneOrders = orderMap.get(zoneId) || [];
      const metrics = computeFranchiseSettlementMetrics(
        zoneOrders,
        account.settlementConfig,
      );

      return {
        accountId: String(account._id),
        franchiseId: String(account.franchiseApplicationId?._id || account.franchiseApplicationId || ""),
        franchiseName: account.franchiseApplicationId?.fullName || "Franchise",
        email: account.email,
        mobile: account.franchiseApplicationId?.mobile || "",
        zoneId,
        zoneName: account.zoneId?.name || "-",
        accountStatus: account.status,
        settlementConfig: metrics.rules,
        ...metrics,
        settlementReadyValue: metrics.settlementEligibleAmount,
      };
    });

    const summary = settlements.reduce(
      (accumulator, settlement) => ({
        totalFranchiseAccounts: accumulator.totalFranchiseAccounts + 1,
        activeAccounts:
          accumulator.activeAccounts +
          (settlement.accountStatus === "ACTIVE" ? 1 : 0),
        blockedAccounts:
          accumulator.blockedAccounts +
          (settlement.accountStatus !== "ACTIVE" ? 1 : 0),
        mappedZones: accumulator.mappedZones + (settlement.zoneId ? 1 : 0),
        totalOrders: accumulator.totalOrders + settlement.totalOrders,
        deliveredOrders: accumulator.deliveredOrders + settlement.deliveredOrders,
        grossSales: accumulator.grossSales + settlement.grossSales,
        paidAmount: accumulator.paidAmount + settlement.paidAmount,
        onlineCollected:
          accumulator.onlineCollected + settlement.onlineCollected,
        codOrderValue: accumulator.codOrderValue + settlement.codOrderValue,
        settlementReadyValue:
          accumulator.settlementReadyValue + settlement.settlementEligibleAmount,
        settlementEligibleAmount:
          accumulator.settlementEligibleAmount + settlement.settlementEligibleAmount,
        settlementInHoldAmount:
          accumulator.settlementInHoldAmount + settlement.settlementInHoldAmount,
        commissionAmount:
          accumulator.commissionAmount + settlement.commissionAmount,
        projectedCommissionAmount:
          accumulator.projectedCommissionAmount + settlement.projectedCommissionAmount,
        netPayoutDue:
          accumulator.netPayoutDue + settlement.netPayoutDue,
        projectedNetSettlement:
          accumulator.projectedNetSettlement + settlement.projectedNetSettlement,
        belowThresholdAmount:
          accumulator.belowThresholdAmount + settlement.belowThresholdAmount,
        deliveredPendingCollection:
          accumulator.deliveredPendingCollection +
          settlement.deliveredPendingCollection,
        openOrderValue:
          accumulator.openOrderValue + settlement.openOrderValue,
        cancelledValue:
          accumulator.cancelledValue + settlement.cancelledValue,
      }),
      {
        totalFranchiseAccounts: 0,
        activeAccounts: 0,
        blockedAccounts: 0,
        mappedZones: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        grossSales: 0,
        paidAmount: 0,
        onlineCollected: 0,
        codOrderValue: 0,
        settlementReadyValue: 0,
        settlementEligibleAmount: 0,
        settlementInHoldAmount: 0,
        commissionAmount: 0,
        projectedCommissionAmount: 0,
        netPayoutDue: 0,
        projectedNetSettlement: 0,
        belowThresholdAmount: 0,
        deliveredPendingCollection: 0,
        openOrderValue: 0,
        cancelledValue: 0,
      },
    );

    res.json({
      success: true,
      summary,
      settlements,
    });
  } catch (err) {
    console.error("Franchise Settlement Summary Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminFranchiseRestockRequests = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await FranchiseRestockRequest.find(filter)
      .populate("franchiseApplicationId", "fullName mobile email")
      .populate("franchiseAccountId", "email status")
      .populate("zoneId", "name status")
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
    console.error("Get Admin Franchise Restock Requests Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAdminFranchiseRestockRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, updatedStock } = req.body;

    if (!VALID_ADMIN_RESTOCK_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid restock status" });
    }

    const request = await FranchiseRestockRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Restock request not found" });
    }

    request.status = status;
    request.adminNote = String(adminNote || "").trim();
    request.resolvedAt = FINAL_RESTOCK_STATUSES.includes(status) ? new Date() : null;
    await request.save();

    if (status === "FULFILLED") {
      const existingSetting = await FranchiseInventorySetting.findOne({
        franchiseAccountId: request.franchiseAccountId,
        productId: request.productId,
      }).lean();
      const computedStock =
        updatedStock === "" || updatedStock === null || typeof updatedStock === "undefined"
          ? Math.max(request.targetStock || 0, request.currentStock + request.requestedQty)
          : Number(updatedStock);

      await FranchiseInventorySetting.findOneAndUpdate(
        {
          franchiseAccountId: request.franchiseAccountId,
          productId: request.productId,
        },
        {
          franchiseAccountId: request.franchiseAccountId,
          zoneId: request.zoneId,
          productId: request.productId,
          productName: request.productName,
          currentStock: Number.isFinite(computedStock) && computedStock >= 0
            ? computedStock
            : request.currentStock,
          lowStockThreshold: request.lowStockThreshold,
          targetStock: request.targetStock,
          preferredRestockQty: request.requestedQty,
          notes: request.adminNote || existingSetting?.notes || "",
          lastUpdatedBy: getActorName(req),
          lastUpdatedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    const populatedRequest = await FranchiseRestockRequest.findById(id)
      .populate("franchiseApplicationId", "fullName mobile email")
      .populate("franchiseAccountId", "email status")
      .populate("zoneId", "name status")
      .lean();

    res.json({
      success: true,
      message: "Restock request updated successfully",
      request: populatedRequest,
    });
  } catch (err) {
    console.error("Update Admin Franchise Restock Request Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
