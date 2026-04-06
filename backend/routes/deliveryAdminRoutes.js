import express  from 'express';
import mongoose from 'mongoose';
import DeliveryAgent from '../models/DeliveryAgent.js';
import Order         from '../models/Order.js';
import Earning       from '../models/Earning.js';          // ← shared model
import {
  notifyApproved,
  notifyRejected,
} from "../services/notificationService.js";
import { adminDraft, adminDeleteAgent } from "../controllers/deliveryController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
//  SCHEMAS  (DeliveryOrder only — EarningSchema removed, using shared model)
// ─────────────────────────────────────────────────────────────────────────────

const DeliveryOrderSchema = new mongoose.Schema({
  orderId:         { type: String, required: true },
  customerName:    { type: String },
  customerPhone:   { type: String },
  customerAddress: { type: String },
  assignedAgent:   { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent' },
  status:          { type: String, enum: ['Pending','Assigned','Picked','In Transit','Delivered','Failed','Cancelled'], default: 'Pending' },
  orderAmount:     { type: Number, default: 0 },
  deliveryFee:     { type: Number, default: 0 },
  scheduledTime:   { type: Date },
  deliveredAt:     { type: Date },
  notes:           { type: String },
  paymentStatus:   { type: String, enum: ['Pending','Paid','COD'], default: 'Pending' },
  orderType:       { type: String, enum: ['pickup','delivery'], default: 'delivery' },
  location:        { type: String, default: '' },
}, { timestamps: true });

const DeliveryOrder = mongoose.models.DeliveryOrder || mongoose.model('DeliveryOrder', DeliveryOrderSchema);

// ─────────────────────────────────────────────────────────────────────────────
//  OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const [totalAgents, activeAgents, onlineAgents,
      totalOrders, pendingOrders, deliveredOrders, todayEarnings] = await Promise.all([
      DeliveryAgent.countDocuments(),
      DeliveryAgent.countDocuments({ status: 'approved' }),
      DeliveryAgent.countDocuments({ availability: 'online' }),
      DeliveryOrder.countDocuments(),
      DeliveryOrder.countDocuments({ status: 'Pending' }),
      DeliveryOrder.countDocuments({ status: 'Delivered' }),
      Earning.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const sevenDays = [];
    for (let i = 6; i >= 0; i--) {
      const d     = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0,0,0,0));
      const end   = new Date(d.setHours(23,59,59,999));
      const count = await DeliveryOrder.countDocuments({ createdAt: { $gte: start, $lte: end } });
      sevenDays.push({ day: start.toLocaleDateString('en-IN', { weekday: 'short' }), orders: count });
    }

    res.json({
      success: true, data: {
        totalAgents, activeAgents, onlineAgents,
        totalOrders, pendingOrders, deliveredOrders,
        todayEarnings: todayEarnings[0]?.total || 0,
        sevenDayTrend: sevenDays,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  AGENTS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agents/stats', async (req, res) => {
  try {
    const [total, approved, pending, rejected, suspended, draft, online, deliveriesAgg] = await Promise.all([
      DeliveryAgent.countDocuments(),
      DeliveryAgent.countDocuments({ status: 'approved' }),
      DeliveryAgent.countDocuments({ status: 'pending' }),
      DeliveryAgent.countDocuments({ status: 'rejected' }),
      DeliveryAgent.countDocuments({ status: 'suspended' }),
      DeliveryAgent.countDocuments({ status: 'draft' }),
      DeliveryAgent.countDocuments({ availability: 'online', status: 'approved' }),
      DeliveryAgent.aggregate([{ $group: { _id: null, total: { $sum: '$totalDeliveries' } } }]),
    ]);
    res.json({
      success: true,
      stats: { total, approved, pending, rejected, suspended, draft, online, totalDeliveries: deliveriesAgg[0]?.total || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/agents/pending', async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: agents, total: agents.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/agents/online', async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({ availability: 'online', status: 'approved' })
      .select('-password')
      .populate('currentOrder', 'orderId status customerName');
    res.json({ success: true, agents, count: agents.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/agents', async (req, res) => {
  try {
    const { status, zone, search, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (zone)   filter.assignedArea = zone;
    if (search) filter.$or = [
      { name:    new RegExp(search, 'i') },
      { phone:   new RegExp(search, 'i') },
      { email:   new RegExp(search, 'i') },
      { agentId: new RegExp(search, 'i') },
    ];
    const [agents, total, pending, approved, rejected, suspended, draft] = await Promise.all([
      DeliveryAgent.find(filter).select('-password').skip((page-1)*limit).limit(Number(limit)).sort({ createdAt: -1 }),
      DeliveryAgent.countDocuments(filter),
      DeliveryAgent.countDocuments({ status: 'pending' }),
      DeliveryAgent.countDocuments({ status: 'approved' }),
      DeliveryAgent.countDocuments({ status: 'rejected' }),
      DeliveryAgent.countDocuments({ status: 'suspended' }),
      DeliveryAgent.countDocuments({ status: 'draft' }),
    ]);
    res.json({ success: true, agents, data: agents, total, page: Number(page), counts: { pending, approved, rejected, suspended, draft } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/agents/:id', async (req, res) => {
  try {
    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/agents/:id/approve', async (req, res) => {
  try {
    const { commission, incentive, incentiveDeliveryTarget } = req.body;
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved', approvalNote: 'Approved by admin', approvedAt: new Date(),
        fieldsToRevise: [], draftNote: "", draftSentAt: null,
        ...(commission              !== undefined && { commission:              Number(commission) }),
        ...(incentive               !== undefined && { incentive:               Number(incentive) }),
        ...(incentiveDeliveryTarget !== undefined && { incentiveDeliveryTarget: Number(incentiveDeliveryTarget) }),
      },
      { new: true }
    ).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    notifyApproved({ name: agent.name, email: agent.email, phone: agent.phone, agentId: agent.agentId }).catch(console.error);
    res.json({ success: true, message: `${agent.name} approved! Email & SMS sent.`, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/agents/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approvalNote: reason || 'Rejected by admin', rejectionReason: reason || "" },
      { new: true }
    ).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    notifyRejected({ name: agent.name, email: agent.email, phone: agent.phone, reason }).catch(console.error);
    res.json({ success: true, message: 'Agent rejected. Email & SMS sent.', data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/agents/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended', approvalNote: reason || 'Suspended by admin', availability: 'offline' },
      { new: true }
    ).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, message: 'Agent suspended', data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/agents/:id/reactivate', async (req, res) => {
  try {
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvalNote: 'Reactivated by admin' },
      { new: true }
    ).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    notifyApproved({ name: agent.name, email: agent.email, phone: agent.phone, agentId: agent.agentId }).catch(console.error);
    res.json({ success: true, message: 'Agent reactivated. Email & SMS sent.', data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/agents/:id/commission', async (req, res) => {
  try {
    const { commission, incentive, incentiveDeliveryTarget } = req.body;
    const update = {};
    if (commission              !== undefined) update.commission              = Number(commission);
    if (incentive               !== undefined) update.incentive               = Number(incentive);
    if (incentiveDeliveryTarget !== undefined) update.incentiveDeliveryTarget = Number(incentiveDeliveryTarget);
    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, message: 'Commission updated', data: agent });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/agents/:id/toggle-online', async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    agent.availability = agent.availability === 'online' ? 'offline' : 'online';
    await agent.save();
    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/agents/:id/draft', adminDraft);
router.delete('/agents/:id', adminDeleteAgent);

// ─────────────────────────────────────────────────────────────────────────────
//  ORDERS  (DeliveryOrder module orders — unchanged)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, agent, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status) filter.status        = status;
    if (agent)  filter.assignedAgent = agent;
    if (search) filter.$or = [
      { orderId:       new RegExp(search, 'i') },
      { customerName:  new RegExp(search, 'i') },
      { customerPhone: new RegExp(search, 'i') },
    ];
    const [orders, total] = await Promise.all([
      DeliveryOrder.find(filter).populate('assignedAgent', 'name phone')
        .skip((page-1)*limit).limit(Number(limit)).sort({ createdAt: -1 }),
      DeliveryOrder.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const order = await DeliveryOrder.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const order = await DeliveryOrder.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedAgent', 'name phone');
    if (req.body.status === 'Delivered' && order) {
      order.deliveredAt = new Date();
      await order.save();
      if (order.assignedAgent) {
        const agentId = order.assignedAgent._id || order.assignedAgent;
        // Write to the shared Earning model (not the old DeliveryEarning)
        await Earning.findOneAndUpdate(
          { agent: agentId, order: order._id, type: 'Commission' },
          { $setOnInsert: { agent: agentId, order: order._id, type: 'Commission', amount: order.deliveryFee || 30, isPaid: false, createdAt: new Date() } },
          { upsert: true, new: true }
        );
        await DeliveryAgent.findByIdAndUpdate(agentId, { $inc: { totalDeliveries: 1 } });
      }
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/orders/:id/assign', async (req, res) => {
  try {
    const { agentId, orderType, location } = req.body;
    const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { orderId: req.params.id };
    const order = await DeliveryOrder.findOneAndUpdate(
      query,
      { assignedAgent: agentId, status: 'Assigned', orderType, location },
      { new: true }
    ).populate('assignedAgent', 'name phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order assigned successfully', data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  ANALYTICS  (uses shared Earning + Order models for accurate data)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [statusBreakdown, daily, topAgents] = await Promise.all([
      // Status from main Order model (D2C assigned orders)
      Order.aggregate([
        { $match: { deliveryAgent: { $exists: true, $ne: null } } },
        { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Daily from main Order model
      Order.aggregate([
        { $match: { deliveryAgent: { $exists: true, $ne: null }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id:       { $dateToString: { format: '%d/%m', date: '$createdAt' } },
          orders:    { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'delivered'] }, 1, 0] } },
          revenue:   { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'delivered'] }, '$totalAmount', 0] } },
        }},
        { $sort: { _id: 1 } },
      ]),

      // Top agents from shared Earning model
      DeliveryAgent.find({ status: 'approved' })
        .sort({ totalDeliveries: -1 }).limit(5)
        .select('name agentId totalDeliveries avgRating commission')
        .lean()
        .then(agents => Promise.all(agents.map(async a => {
          const [deliveries, earningAgg] = await Promise.all([
            Order.countDocuments({ deliveryAgent: a._id, deliveryStatus: 'delivered' }),
            Earning.aggregate([
              { $match: { agent: a._id } },
              { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: { $cond: ['$isPaid', '$amount', 0] } } } },
            ]),
          ]);
          return { ...a, totalDeliveries: deliveries, totalEarnings: earningAgg[0]?.total || 0, paidEarnings: earningAgg[0]?.paid || 0 };
        }))),
    ]);

    res.json({ success: true, data: { statusBreakdown, daily, topAgents } });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  EARNINGS  (all 4 routes use shared Earning model — no more DeliveryEarning)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/delivery/admin/earnings
router.get('/earnings', async (req, res) => {
  try {
    const { agentId, isPaid, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (agentId) filter.agent  = agentId;
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [earnings, total, summary, agentSummary] = await Promise.all([
      Earning.find(filter)
        .populate('agent', 'name agentId phone')
        .populate('order', 'orderId totalAmount address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Earning.countDocuments(filter),

      Earning.aggregate([{ $group: {
        _id:         null,
        totalPaid:   { $sum: { $cond: ['$isPaid',  '$amount', 0] } },
        totalUnpaid: { $sum: { $cond: ['$isPaid',  0, '$amount'] } },
        totalAmount: { $sum: '$amount' },
        totalCount:  { $sum: 1 },
      }}]),

      Earning.aggregate([
        { $group: {
          _id:     '$agent',
          total:   { $sum: '$amount' },
          paid:    { $sum: { $cond: ['$isPaid', '$amount', 0] } },
          pending: { $sum: { $cond: ['$isPaid', 0, '$amount'] } },
          count:   { $sum: 1 },
        }},
        { $lookup: { from: 'deliveryagents', localField: '_id', foreignField: '_id', as: 'agent' } },
        { $unwind: '$agent' },
        { $project: { name: '$agent.name', agentId: '$agent.agentId', total: 1, paid: 1, pending: 1, count: 1 } },
        { $sort: { pending: -1 } },
        { $limit: 20 },
      ]),
    ]);

    res.json({
      success: true,
      data: earnings,
      total,
      summary:      summary[0] || { totalPaid: 0, totalUnpaid: 0, totalAmount: 0, totalCount: 0 },
      agentSummary,
    });
  } catch (err) {
    console.error('GET /earnings error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/delivery/admin/earnings/:id/pay
router.patch('/earnings/:id/pay', async (req, res) => {
  try {
    const earning = await Earning.findByIdAndUpdate(
      req.params.id,
      { isPaid: true, paidAt: new Date() },
      { new: true }
    ).populate('agent', 'name agentId');
    if (!earning) return res.status(404).json({ success: false, message: 'Earning record not found' });
    res.json({ success: true, message: `₹${earning.amount} marked as paid for ${earning.agent?.name}`, data: earning });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/delivery/admin/earnings/bulk-pay
router.post('/earnings/bulk-pay', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    const result = await Earning.updateMany(
      { _id: { $in: ids }, isPaid: false },
      { $set: { isPaid: true, paidAt: new Date() } }
    );
    res.json({ success: true, message: `${result.modifiedCount} payments marked as paid` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/delivery/admin/earnings/sync
// Backfills Earning records for all delivered orders that don't have one yet.
router.post('/earnings/sync', async (req, res) => {
  try {
    const deliveredOrders = await Order.find({
      deliveryStatus: 'delivered',
      deliveryAgent:  { $exists: true, $ne: null },
    }).populate('deliveryAgent', 'commission').lean();

    let created = 0, skipped = 0;

    for (const order of deliveredOrders) {
      const agentId    = order.deliveryAgent?._id || order.deliveryAgent;
      const commission = order.deliveryAgent?.commission ?? 7;
      const amount     = order.deliveryPayout || Math.round((order.totalAmount || 0) * commission / 100);

      try {
        const existing = await Earning.findOneAndUpdate(
          { agent: agentId, order: order._id, type: 'Commission' },
          { $setOnInsert: {
            agent:     agentId,
            order:     order._id,
            type:      'Commission',
            amount,
            isPaid:    false,
            createdAt: order.deliveredAt || order.updatedAt || new Date(),
          }},
          { upsert: true, new: false }
        );
        if (!existing) created++;
        else skipped++;
      } catch (e) {
        if (e.code !== 11000) throw e;
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Sync complete — ${created} new records created, ${skipped} already existed`,
      created, skipped, total: deliveredOrders.length,
    });
  } catch (err) {
    console.error('Sync earnings error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;