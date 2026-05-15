// controllers/saleOrderController.js
import SaleOrder      from "../models/Saleorder.js";
import BioburgPayment from "../models/Bioburgpayment.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import { creditProductSalePoints, triggerPointsSync } from "./targetController.js";  

/* helpers  */
const agentGuard = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id).select("name");
  if (!agent) { res.status(404).json({ message: "Agent not found" }); return null; }
  return agent;
};

export const createSaleOrder = async (req, res) => {
  try {
    const agent = await agentGuard(req, res);
    if (!agent) return;

    const {
      customerName, customerPhone, customerAlternatePhone, customerWhatsappPhone,
      customerAddress, customerGST, customerLicenses,
      orderType, items, subtotal, discountAmt, taxAmt, taxPercent, grandTotal,
      paymentMode, paymentStatus, paidAmount, notes, visitArea,
    } = req.body;

    if (!customerName?.trim())   return res.status(400).json({ message: "Customer name required" });
    if (!items?.length)          return res.status(400).json({ message: "At least one item required" });

    const paid   = paymentStatus === "paid"    ? grandTotal
                 : paymentStatus === "partial" ? Number(paidAmount) || 0
                 : 0;

    const order = await SaleOrder.create({
      agentId:         req.user.id,
      agentName:       agent.name,
      customerName,
      customerPhone,
      customerAlternatePhone,
      customerWhatsappPhone,
      customerAddress,
      customerGST,
      customerLicenses,
      orderType:       orderType || "bill",
      items,
      subtotal, discountAmt, taxAmt, taxPercent, grandTotal,
      paymentMode, paymentStatus,
      paidAmount:  paid,
      dueAmount:   Math.max(0, grandTotal - paid),
      notes, visitArea,
      paymentLedger: paid > 0 ? [{
        amount: paid, mode: paymentMode, note: "Initial payment", recordedAt: new Date(),
      }] : [],
    });

    const agentId = req.user.id;
    creditProductSalePoints(agentId, order.items).catch((err) =>
      console.error("[SaleOrder] creditProductSalePoints error:", err)
    );

    triggerPointsSync(agentId).catch((err) =>
      console.error("[SaleOrder] triggerPointsSync error:", err)
    );

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAgentOrders = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const filter = { agentId: req.user.id, isVoid: false };

    if (type)   filter.orderType     = type;
    if (status) filter.paymentStatus = status;
    if (search) filter.$or = [
      { orderNumber:   { $regex: search, $options: "i" } },
      { customerName:  { $regex: search, $options: "i" } },
      { customerPhone: { $regex: search, $options: "i" } },
    ];

    const [orders, total] = await Promise.all([
      SaleOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      SaleOrder.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSaleOrderById = async (req, res) => {
  try {
    const order = await SaleOrder.findOne({ _id: req.params.id, agentId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { amount, mode, note } = req.body;
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: "Valid amount required" });

    const order = await SaleOrder.findOne({ _id: req.params.id, agentId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const newPaid = order.paidAmount + Number(amount);
    order.paidAmount    = Math.min(newPaid, order.grandTotal);
    order.dueAmount     = Math.max(0, order.grandTotal - order.paidAmount);
    order.paymentStatus = order.dueAmount === 0 ? "paid"
                        : order.paidAmount > 0  ? "partial" : "pending";
    if (mode) order.paymentMode = mode;

    order.paymentLedger.push({
      amount: Number(amount), mode: mode || order.paymentMode,
      note: note || "", recordedAt: new Date(),
    });

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const voidOrder = async (req, res) => {
  try {
    const order = await SaleOrder.findOne({ _id: req.params.id, agentId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.isVoid     = true;
    order.voidReason = req.body.reason || "Voided by agent";
    await order.save();
    res.json({ success: true, message: "Order voided" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const { status, mode, from, to, page = 1, limit = 30 } = req.query;
    const match = { agentId: new (await import("mongoose")).default.Types.ObjectId(req.user.id) };

    if (status) match.paymentStatus = status;
    if (mode)   match.paymentMode   = mode;
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(to + "T23:59:59");
    }

    const skip = (page - 1) * limit;

    const stats = await SaleOrder.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        totalGrand:  { $sum: "$grandTotal" },
        totalPaid:   { $sum: "$paidAmount" },
        totalDue:    { $sum: "$dueAmount" },
        countOrders: { $sum: 1 },
      }},
    ]);

    const orders = await SaleOrder.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("orderNumber orderType customerName grandTotal paidAmount dueAmount paymentStatus paymentMode paymentLedger createdAt visitArea")
      .lean();

    const total = await SaleOrder.countDocuments(match);

    res.json({
      success: true,
      summary: stats[0] || { totalGrand: 0, totalPaid: 0, totalDue: 0, countOrders: 0 },
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBioburgPayments = async (req, res) => {
  try {
    const { type, status, year, month } = req.query;
    const filter = { agentId: req.user.id };

    if (type)   filter.paymentType = type;
    if (status) filter.status      = status;
    if (year)   filter.forYear     = Number(year);
    if (month)  filter.forMonth    = Number(month);

    const [payments, summary] = await Promise.all([
      BioburgPayment.find(filter).sort({ createdAt: -1 }).lean(),
      BioburgPayment.aggregate([
        { $match: { agentId: new (await import("mongoose")).default.Types.ObjectId(req.user.id) } },
        { $group: {
          _id: null,
          totalPaid:    { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
          totalPending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
          count:        { $sum: 1 },
        }},
      ]),
    ]);

    res.json({
      success: true,
      payments,
      summary: summary[0] || { totalPaid: 0, totalPending: 0, count: 0 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBioburgPayment = async (req, res) => {
  try {
    const {
      agentId, paymentType, amount, mode, forMonth, forYear,
      status, paidOn, bankName, accountLast4, txnRef, chequeNo, remarks,
    } = req.body;

    if (!agentId) return res.status(400).json({ message: "agentId required" });
    if (!amount)  return res.status(400).json({ message: "amount required" });

    const agent = await MarketingAgent.findById(agentId).select("name");
    if (!agent)  return res.status(404).json({ message: "Agent not found" });

    const payment = await BioburgPayment.create({
      agentId, agentName: agent.name,
      paymentType, amount, mode, forMonth, forYear,
      status: status || "pending",
      paidOn: paidOn ? new Date(paidOn) : undefined,
      bankName, accountLast4, txnRef, chequeNo, remarks,
      createdByAdmin: req.user?.name || "admin",
    });

    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};