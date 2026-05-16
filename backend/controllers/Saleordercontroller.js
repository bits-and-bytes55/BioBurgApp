// controllers/saleOrderController.js
import mongoose from "mongoose";
import SaleOrder from "../models/Saleorder.js";
import BioburgPayment from "../models/Bioburgpayment.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import Target from "../models/Target.js";
import AgentPoints from "../models/Agentpoints.js";

const getVisibleAgentIds = async (agentId) => {
  const rootId = agentId.toString();

  const rootAgent = await MarketingAgent.findById(rootId)
  .select("teamMembers role permissions")
  .lean();

if (!rootAgent) return [rootId];

if (rootAgent.permissions?.allAgentsAccess) {
  const allAgents = await MarketingAgent.find().select("_id").lean();
  return allAgents.map((a) => a._id.toString());
}

  const visibleIds = new Set([rootId]);
  const queue = [...(rootAgent.teamMembers || []).map((id) => id.toString())];

  const directReports = await MarketingAgent.find({ reportsTo: rootId })
    .select("_id")
    .lean();

  directReports.forEach((agent) => {
    if (agent._id) queue.push(agent._id.toString());
  });

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visibleIds.has(currentId)) continue;

    visibleIds.add(currentId);

    const children = await MarketingAgent.find({ reportsTo: currentId })
      .select("_id teamMembers")
      .lean();

    children.forEach((child) => {
      if (child._id) queue.push(child._id.toString());
    });

    const currentAgent = await MarketingAgent.findById(currentId)
      .select("teamMembers")
      .lean();

    (currentAgent?.teamMembers || []).forEach((id) => {
      queue.push(id.toString());
    });
  }

  return [...visibleIds];
};

const getVisibleAgentObjectIds = async (agentId) => {
  const ids = await getVisibleAgentIds(agentId);
  return ids.map((id) => new mongoose.Types.ObjectId(id));
};

const agentGuard = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id).select("name");
  if (!agent) {
    res.status(404).json({ message: "Agent not found" });
    return null;
  }
  return agent;
};

async function creditProductSalePoints(agentId, items = []) {
  try {
    for (const item of items) {
      const name = (
        item.productName && item.productName !== "Unknown Product"
          ? item.productName
          : item.brandName || ""
      ).trim();

      if (!name) continue;

      const nameRegex = new RegExp(`^${name}$`, "i");

      const linkedTargets = await Target.find({
        type: "points",
        linkedProductName: nameRegex,
        $or: [
          { agentId: new mongoose.Types.ObjectId(agentId) },
          { agentId: { $exists: false } },
          { agentId: null },
        ],
      }).lean();

      for (const target of linkedTargets) {
        const ptsPerUnit = target.pointsPerUnit || 0;
        const unitsSold = item.qty || 1;
        const ptsToCredit = ptsPerUnit * unitsSold;

        if (ptsToCredit <= 0) continue;

        await AgentPoints.create({
          agentId,
          taskKey: "product_sale",
          taskLabel: `Product Sale: ${name}`,
          points: ptsToCredit,
          referenceId: target._id.toString(),
          referenceModel: "Target",
          note: `${unitsSold} unit(s) x ${ptsPerUnit} pts - "${target.name}"`,
          addedBy: "system",
        });
      }
    }
  } catch (err) {
    console.error("[creditProductSalePoints] error:", err);
  }
}

export const createSaleOrder = async (req, res) => {
  try {
    const agent = await agentGuard(req, res);
    if (!agent) return;

    const {
      customerName,
      customerPhone,
      customerAlternatePhone,
      customerWhatsappPhone,
      customerAddress,
      customerGST,
      customerLicenses,
      orderType,
      items,
      subtotal,
      discountAmt,
      taxAmt,
      taxPercent,
      grandTotal,
      paymentMode,
      paymentStatus,
      paidAmount,
      notes,
      visitArea,
    } = req.body;

    if (!customerName?.trim()) {
      return res.status(400).json({ message: "Customer name required" });
    }

    if (!items?.length) {
      return res.status(400).json({ message: "At least one item required" });
    }

    const paid =
      paymentStatus === "paid"
        ? grandTotal
        : paymentStatus === "partial"
        ? Number(paidAmount) || 0
        : 0;

    const order = await SaleOrder.create({
      agentId: req.user.id,
      agentName: agent.name,
      customerName,
      customerPhone,
      customerAlternatePhone,
      customerWhatsappPhone,
      customerAddress,
      customerGST,
      customerLicenses,
      orderType: orderType || "bill",
      items,
      subtotal,
      discountAmt,
      taxAmt,
      taxPercent,
      grandTotal,
      paymentMode,
      paymentStatus,
      paidAmount: paid,
      dueAmount: Math.max(0, grandTotal - paid),
      notes,
      visitArea,
      paymentLedger:
        paid > 0
          ? [
              {
                amount: paid,
                mode: paymentMode,
                note: "Initial payment",
                recordedAt: new Date(),
              },
            ]
          : [],
    });

    creditProductSalePoints(req.user.id, order.items).catch((err) =>
      console.error("[SaleOrder] product points credit error:", err)
    );

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAgentOrders = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const visibleAgentIds = await getVisibleAgentObjectIds(req.user.id);

    const filter = {
      agentId: { $in: visibleAgentIds },
      isVoid: false,
    };

    if (type) filter.orderType = type;
    if (status) filter.paymentStatus = status;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { agentName: { $regex: search, $options: "i" } },
        { visitArea: { $regex: search, $options: "i" } },
      ];
    }

    const pageNo = Number(page);
    const limitNo = Number(limit);

    const [orders, total] = await Promise.all([
      SaleOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * limitNo)
        .limit(limitNo)
        .lean(),
      SaleOrder.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      total,
      page: pageNo,
      pages: Math.ceil(total / limitNo),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSaleOrderById = async (req, res) => {
  try {
    const visibleAgentIds = await getVisibleAgentObjectIds(req.user.id);

    const order = await SaleOrder.findOne({
      _id: req.params.id,
      agentId: { $in: visibleAgentIds },
    }).lean();

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { amount, mode, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid amount required" });
    }

    const visibleAgentIds = await getVisibleAgentObjectIds(req.user.id);

    const order = await SaleOrder.findOne({
      _id: req.params.id,
      agentId: { $in: visibleAgentIds },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    const newPaid = order.paidAmount + Number(amount);

    order.paidAmount = Math.min(newPaid, order.grandTotal);
    order.dueAmount = Math.max(0, order.grandTotal - order.paidAmount);
    order.paymentStatus =
      order.dueAmount === 0
        ? "paid"
        : order.paidAmount > 0
        ? "partial"
        : "pending";

    if (mode) order.paymentMode = mode;

    order.paymentLedger.push({
      amount: Number(amount),
      mode: mode || order.paymentMode,
      note: note || "",
      recordedAt: new Date(),
      recordedBy: req.user.id,
    });

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const voidOrder = async (req, res) => {
  try {
    const visibleAgentIds = await getVisibleAgentObjectIds(req.user.id);

    const order = await SaleOrder.findOne({
      _id: req.params.id,
      agentId: { $in: visibleAgentIds },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.isVoid = true;
    order.voidReason = req.body.reason || "Voided by agent";
    order.voidedBy = req.user.id;
    order.voidedAt = new Date();

    await order.save();

    res.json({ success: true, message: "Order voided" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const { status, mode, from, to, page = 1, limit = 30 } = req.query;
    const visibleAgentIds = await getVisibleAgentObjectIds(req.user.id);

    const match = {
      agentId: { $in: visibleAgentIds },
      isVoid: false,
    };

    if (status) match.paymentStatus = status;
    if (mode) match.paymentMode = mode;

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(`${to}T23:59:59`);
    }

    const pageNo = Number(page);
    const limitNo = Number(limit);

    const [stats, orders, total] = await Promise.all([
      SaleOrder.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalGrand: { $sum: "$grandTotal" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            countOrders: { $sum: 1 },
          },
        },
      ]),
      SaleOrder.find(match)
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * limitNo)
        .limit(limitNo)
        .select(
          "orderNumber orderType agentId agentName customerName grandTotal paidAmount dueAmount paymentStatus paymentMode paymentLedger createdAt visitArea"
        )
        .lean(),
      SaleOrder.countDocuments(match),
    ]);

    res.json({
      success: true,
      summary: stats[0] || {
        totalGrand: 0,
        totalPaid: 0,
        totalDue: 0,
        countOrders: 0,
      },
      orders,
      total,
      page: pageNo,
      pages: Math.ceil(total / limitNo),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBioburgPayments = async (req, res) => {
  try {
    const { type, status, year, month } = req.query;
    const visibleAgentIds = await getVisibleAgentObjectIds(req.user.id);

    const filter = {
      agentId: { $in: visibleAgentIds },
    };

    if (type) filter.paymentType = type;
    if (status) filter.status = status;
    if (year) filter.forYear = Number(year);
    if (month) filter.forMonth = Number(month);

    const [payments, summary] = await Promise.all([
      BioburgPayment.find(filter).sort({ createdAt: -1 }).lean(),
      BioburgPayment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalPaid: {
              $sum: {
                $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
              },
            },
            totalPending: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      payments,
      summary: summary[0] || {
        totalPaid: 0,
        totalPending: 0,
        count: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBioburgPayment = async (req, res) => {
  try {
    const {
      agentId,
      paymentType,
      amount,
      mode,
      forMonth,
      forYear,
      status,
      paidOn,
      bankName,
      accountLast4,
      txnRef,
      chequeNo,
      remarks,
    } = req.body;

    if (!agentId) return res.status(400).json({ message: "agentId required" });
    if (!amount) return res.status(400).json({ message: "amount required" });

    const agent = await MarketingAgent.findById(agentId).select("name");
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const payment = await BioburgPayment.create({
      agentId,
      agentName: agent.name,
      paymentType,
      amount,
      mode,
      forMonth,
      forYear,
      status: status || "pending",
      paidOn: paidOn ? new Date(paidOn) : undefined,
      bankName,
      accountLast4,
      txnRef,
      chequeNo,
      remarks,
      createdByAdmin: req.user?.name || "admin",
    });

    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
