import SaleOrder from "../models/Saleorder.model.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

/*AGENT — CREATE ORDER */
export const createOrder = async (req, res) => {
  try {
    const agentId = req.user.id;
    const agent   = await MarketingAgent.findById(agentId).select("name").lean();

    const {
      customerName, customerPhone, customerAddress, customerGST,
      orderType, items,
      subtotal, discountAmt, taxAmt, taxPercent, grandTotal,
      paymentMode, paymentStatus, paidAmount,
      notes, visitArea, visitAddress
    } = req.body;

    if (!customerName?.trim())
      return res.status(400).json({ message: "Customer name is required" });
    if (!items || items.length === 0)
      return res.status(400).json({ message: "Add at least one item" });

    const order = await SaleOrder.create({
      agent: agentId,
      agentName: agent?.name || "Unknown",
      customerName: customerName.trim(),
      customerPhone, customerAddress, customerGST,
      orderType: orderType || "bill",
      items,
      subtotal, discountAmt, taxAmt, taxPercent, grandTotal,
      paymentMode, paymentStatus, paidAmount: paidAmount || 0,
      notes, visitArea, visitAddress,
      status: "confirmed"
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("createOrder:", err);
    res.status(500).json({ message: err.message });
  }
};

/*AGENT — GET MY ORDERS*/
export const getMyOrders = async (req, res) => {
  try {
    const { type, status, from, to } = req.query;
    const filter = { agent: req.user.id };
    if (type)   filter.orderType = type;
    if (status) filter.status    = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to + "T23:59:59");
    }

    const orders = await SaleOrder.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* AGENT — GET SINGLE ORDER*/
export const getMyOrderById = async (req, res) => {
  try {
    const order = await SaleOrder.findOne({ _id: req.params.id, agent: req.user.id }).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*ADMIN — GET ALL ORDERS*/
export const getAllOrders = async (req, res) => {
  try {
    const { agentId, type, status, from, to, search } = req.query;
    const filter = {};

    if (agentId) filter.agent      = agentId;
    if (type)    filter.orderType  = type;
    if (status)  filter.status     = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to + "T23:59:59");
    }
    if (search) {
      filter.$or = [
        { customerName:  { $regex: search, $options: "i" } },
        { orderNumber:   { $regex: search, $options: "i" } },
        { agentName:     { $regex: search, $options: "i" } },
        { visitArea:     { $regex: search, $options: "i" } },
      ];
    }

    const orders = await SaleOrder.find(filter).sort({ createdAt: -1 }).lean();

    const stats = {
      total:       orders.length,
      bills:       orders.filter(o => o.orderType === "bill").length,
      challans:    orders.filter(o => o.orderType === "challan").length,
      quotations:  orders.filter(o => o.orderType === "quotation").length,
      totalValue:  orders.reduce((s, o) => s + (o.grandTotal || 0), 0),
      paidValue:   orders.reduce((s, o) => s + (o.paidAmount || 0), 0),
      pending:     orders.filter(o => o.paymentStatus !== "paid").length,
    };

    res.json({ success: true, orders, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*ADMIN — GET SINGLE ORDER*/
export const getOrderByIdAdmin = async (req, res) => {
  try {
    const order = await SaleOrder.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*ADMIN — UPDATE ORDER STATUS / PAYMENT*/
export const updateOrderAdmin = async (req, res) => {
  try {
    const { status, paymentStatus, paidAmount, notes } = req.body;
    const order = await SaleOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status)        order.status        = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paidAmount !== undefined) order.paidAmount = paidAmount;
    if (notes)         order.notes         = notes;

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*ADMIN — DELETE ORDER*/
export const deleteOrderAdmin = async (req, res) => {
  try {
    await SaleOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*ADMIN — GET AGENT ORDER SUMMARY*/
export const getAgentOrderSummary = async (req, res) => {
  try {
    const summary = await SaleOrder.aggregate([
      {
        $group: {
          _id: { agent: "$agent", agentName: "$agentName" },
          totalOrders:  { $sum: 1 },
          totalValue:   { $sum: "$grandTotal" },
          paidValue:    { $sum: "$paidAmount" },
          bills:        { $sum: { $cond: [{ $eq: ["$orderType", "bill"] }, 1, 0] } },
          challans:     { $sum: { $cond: [{ $eq: ["$orderType", "challan"] }, 1, 0] } },
          quotations:   { $sum: { $cond: [{ $eq: ["$orderType", "quotation"] }, 1, 0] } },
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};