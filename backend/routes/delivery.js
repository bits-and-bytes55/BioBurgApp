import express      from "express";
import jwt           from "jsonwebtoken";
import mongoose      from "mongoose";
import DeliveryAgent from "../models/DeliveryAgent.js";
import Order         from "../models/Order.js";
import Earning       from "../models/Earning.js";
import { notifyRegistrationReceived } from "../services/notificationService.js";
import { adminProtect } from "../middleware/adminAuth.js";  

const router = express.Router();

/* ─── Agent auth middleware ───────────────────────────────────── */
const agentAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, message: "Login required" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "bioburg_secret");
    if (decoded.role !== "delivery-agent")
      return res.status(403).json({ success: false, message: "Access denied" });
    req.agent = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const signToken = (id) =>
  jwt.sign(
    { id, role: "delivery-agent" },
    process.env.JWT_SECRET || "bioburg_secret",
    { expiresIn: "7d" }
  );

const startOfMonth = () =>
  new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function mapStatus(s) {
  return (
    { pending:"Assigned", assigned:"Assigned", picked:"Picked",
      "in-transit":"In Transit", delivered:"Delivered", cancelled:"Cancelled" }[s]
    || "Assigned"
  );
}

router.get("/admin/agents", adminProtect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const q = {};
    if (status && status !== "all") q.status = status;
    if (search) {
      q.$or = [
        { name:    { $regex: search, $options: "i" } },
        { phone:   { $regex: search, $options: "i" } },
        { email:   { $regex: search, $options: "i" } },
        { agentId: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [agents, total] = await Promise.all([
      DeliveryAgent.find(q).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      DeliveryAgent.countDocuments(q),
    ]);
    const agg = await DeliveryAgent.aggregate([{ $group: { _id: "$status", c: { $sum: 1 } } }]);
    const counts = { pending: 0, approved: 0, rejected: 0, suspended: 0, draft: 0 };
    agg.forEach(({ _id, c }) => { if (_id) counts[_id] = c; });
    res.json({ success: true, agents, data: agents, total, page: +page, pages: Math.ceil(total / +limit), counts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get("/admin/agents/stats", adminProtect, async (req, res) => {
  try {
    const [total, approved, pending, rejected, suspended, draft, online] = await Promise.all([
      DeliveryAgent.countDocuments(),
      DeliveryAgent.countDocuments({ status: "approved" }),
      DeliveryAgent.countDocuments({ status: "pending" }),
      DeliveryAgent.countDocuments({ status: "rejected" }),
      DeliveryAgent.countDocuments({ status: "suspended" }),
      DeliveryAgent.countDocuments({ status: "draft" }),
      DeliveryAgent.countDocuments({ availability: "online", status: "approved" }),
    ]);
    const totalDeliveries = await Order.countDocuments({ deliveryStatus: "delivered" });
    res.json({ success: true, stats: { total, approved, pending, rejected, suspended, draft, online, totalDeliveries } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/admin/agents/online", adminProtect, async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({ availability: "online", status: "approved" })
      .select("agentId name phone vehicleType location availability")
      .lean();

    const enriched = await Promise.all(agents.map(async a => {
      const activeOrder = await Order.findOne({
        deliveryAgent:  a._id,
        deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
        isQueued:       { $ne: true },
      }).select("orderId totalAmount address deliveryStatus").lean();

      return {
        ...a,
        currentOrder: activeOrder ? {
          orderId:    activeOrder.orderId || activeOrder._id.toString().slice(-8).toUpperCase(),
          amount:     activeOrder.totalAmount || 0,
          status:     activeOrder.deliveryStatus,
          destination:[activeOrder.address?.city, activeOrder.address?.state].filter(Boolean).join(", ") || "—",
        } : null,
      };
    }));

    res.json({ success: true, agents: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get("/admin/agents/locations", adminProtect, async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({
      status:       "approved",
      availability: "online",
    })
      .select("agentId name phone vehicleType location availability")
      .lean();

    const enriched = await Promise.all(agents.map(async a => {
      const activeOrder = await Order.findOne({
        deliveryAgent:  a._id,
        deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
        isQueued:       { $ne: true },
      })
        .select("orderId totalAmount address deliveryStatus deliveryPayout")
        .lean();

      return {
        ...a,
        currentOrder: activeOrder
          ? {
              orderId:        activeOrder.orderId || activeOrder._id.toString().slice(-8).toUpperCase(),
              amount:         activeOrder.totalAmount    || 0,
              payout:         activeOrder.deliveryPayout || 0,
              deliveryStatus: activeOrder.deliveryStatus,
              // Destination shown as context in the popup
              destination: [
                activeOrder.address?.addressLine,
                activeOrder.address?.city,
                activeOrder.address?.state,
              ].filter(Boolean).join(", ") || "—",
            }
          : null,
      };
    }));

    res.json({ success: true, agents: enriched });
  } catch (err) {
    console.error("GET /admin/agents/locations error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/register", async (req, res) => {
  try {
    const {
      name, phone, email, password, zone,
      vehicleType, vehicleNumber, drivingLicence, panNumber,
      bankAccount, ifsc, bankName, upiId, accountHolderName,
      aadhaarUrl, licenceCopyUrl, vehicleRCUrl, passportPhotoUrl, upiQrImageUrl,
    } = req.body;

    if (!name || !phone || !password)
      return res.status(400).json({ success: false, message: "Name, phone and password are required" });

    if (await DeliveryAgent.findOne({ phone }))
      return res.status(400).json({ success: false, message: "Phone number already registered" });

    if (email && await DeliveryAgent.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success: false, message: "Email already registered" });

    const agent = await DeliveryAgent.create({
      name,
      phone,
      email:          email?.toLowerCase() || "",
      password,
      assignedArea:   zone || "",
      vehicleType:    vehicleType?.toLowerCase() || "bike",
      vehicleNumber:  vehicleNumber  || "",
      drivingLicence: drivingLicence || "",
      panCard:        panNumber      || "",
      bankDetails: {
        accountNumber:     bankAccount       || "",
        ifscCode:          ifsc              || "",
        bankName:          bankName          || "",
        accountHolderName: accountHolderName || "",
      },
      upiId: upiId || "",
      documents: {
        aadhaar:       aadhaarUrl       || null,
        licenceCopy:   licenceCopyUrl   || null,
        vehicleRC:     vehicleRCUrl     || null,
        passportPhoto: passportPhotoUrl || null,
        upiQrImage:    upiQrImageUrl    || null,
      },
      status: "pending",
    });

    notifyRegistrationReceived({ name, email, phone }).catch(console.error);

    res.status(201).json({
      success: true,
      message: "Registration submitted! You will be notified once your application is reviewed.",
      agentId: agent._id,
    });
  } catch (err) {
    if (err.name === "ValidationError")
      return res.status(400).json({ success: false, message: Object.values(err.errors)[0].message });
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: `${Object.keys(err.keyValue)[0]} already exists` });
    console.error("Delivery register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/delivery/login
───────────────────────────────────────────────────────────────── */
router.post("/login", async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    if (!password || (!phone && !email))
      return res.status(400).json({ success: false, message: "Phone/email and password required" });

    const query = phone ? { phone } : { email: email.toLowerCase() };
    const agent = await DeliveryAgent.findOne(query).select("+password");

    if (!agent || !(await agent.matchPassword(password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (agent.status === "pending")
      return res.status(403).json({ success: false, status: "pending",
        message: "Your application is under review. You will be notified within 24–48 hours." });

    if (agent.status === "draft")
      return res.status(403).json({ success: false, status: "draft",
        message: "Your application needs corrections. Please update the flagged fields.",
        fieldsToRevise: agent.fieldsToRevise,
        draftNote: agent.draftNote,
        agent: (() => { const o = agent.toObject(); delete o.password; return o; })(),
      });

    if (agent.status === "rejected")
      return res.status(403).json({ success: false, status: "rejected",
        message: "Your application was not approved. Contact support@bioburgpharma.com" });

    if (agent.status === "suspended")
      return res.status(403).json({ success: false, status: "suspended",
        message: "Your account has been suspended. Contact admin." });

    const safe = agent.toObject(); delete safe.password;
    res.json({ success: true, token: signToken(agent._id), agent: safe });
  } catch (err) {
    console.error("Delivery login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/delivery/me
───────────────────────────────────────────────────────────────── */
router.get("/me", agentAuth, async (req, res) => {
  try {
    const agentId = new mongoose.Types.ObjectId(req.agent.id);

    const [agent, allOrders, allEarnings, activeOrderDoc] = await Promise.all([
      DeliveryAgent.findById(agentId).select("-password").lean(),
      Order.find({ deliveryAgent: agentId }).select("deliveryStatus createdAt totalAmount deliveryPayout").lean(),
      Earning.find({ agent: agentId }).select("amount isPaid createdAt").lean(),
      Order.findOne({
        deliveryAgent:  agentId,
        deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
        isQueued:       { $ne: true },
      }).select("orderId totalAmount address deliveryStatus deliveryPayout").lean(),
    ]);

    if (!agent)
      return res.status(404).json({ success: false, message: "Agent not found" });

    const monthStart          = startOfMonth();
    const totalDeliveries     = allOrders.filter(o => o.deliveryStatus === "delivered").length;
    const thisMonthDeliveries = allOrders.filter(o => o.deliveryStatus === "delivered" && new Date(o.createdAt) >= monthStart).length;
    const totalEarnings       = allEarnings.reduce((s, e) => s + (e.amount || 0), 0);
    const thisMonthEarnings   = allEarnings.filter(e => new Date(e.createdAt) >= monthStart).reduce((s, e) => s + (e.amount || 0), 0);

    const currentOrder = activeOrderDoc ? {
      orderId:         activeOrderDoc.orderId || activeOrderDoc._id.toString().slice(-8).toUpperCase(),
      customerName:    activeOrderDoc.address?.fullName || "—",
      customerAddress: [activeOrderDoc.address?.addressLine, activeOrderDoc.address?.city, activeOrderDoc.address?.state, activeOrderDoc.address?.pincode].filter(Boolean).join(", "),
      orderAmount:     activeOrderDoc.totalAmount  || 0,
      deliveryPayout:  activeOrderDoc.deliveryPayout || 0,
      status:          mapStatus(activeOrderDoc.deliveryStatus),
    } : null;

    res.json({
      success: true,
      agent: {
        ...agent,
        isOnline:            agent.availability === "online",
        totalDeliveries,
        thisMonthDeliveries,
        totalEarnings,
        thisMonthEarnings,
        avgRating:           agent.avgRating || 0,
        commission:          agent.commission              ?? 7,
        incentive:           agent.incentive               ?? 400,
        incentiveDeliveryTarget: agent.incentiveDeliveryTarget ?? 100,
        currentOrder,
      },
    });
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/delivery/toggle-online
───────────────────────────────────────────────────────────────── */
router.patch("/toggle-online", agentAuth, async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.agent.id);
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });
    agent.availability = agent.availability === "online" ? "offline" : "online";
    await agent.save();
    res.json({
      success:      true,
      availability: agent.availability,
      message:      agent.availability === "online"
        ? "You are now ONLINE — you can receive orders"
        : "You are now OFFLINE",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/delivery/location
   Agent's browser sends their GPS coordinates here.
   The admin map reads these from DeliveryAgent.location.{lat,lng}.
───────────────────────────────────────────────────────────────── */
router.patch("/location", agentAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await DeliveryAgent.findByIdAndUpdate(req.agent.id, {
      "location.lat":       lat,
      "location.lng":       lng,
      "location.updatedAt": new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/delivery/my-orders
───────────────────────────────────────────────────────────────── */
router.get("/my-orders", agentAuth, async (req, res) => {
  try {
    const agentId = req.agent.id;
    const orders  = await Order.find({ deliveryAgent: agentId })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const data = orders.map(o => ({
      _id:             o._id,
      orderId:         o.orderId || o._id.toString().slice(-8).toUpperCase(),
      customerName:    o.address?.fullName  || o.userId?.name  || "—",
      customerPhone:   o.address?.phone     || o.userId?.phone || "",
      customerAddress: [o.address?.addressLine, o.address?.city, o.address?.state, o.address?.pincode].filter(Boolean).join(", "),
      orderAmount:     o.totalAmount    || 0,
      deliveryPayout:  o.deliveryPayout || 0,
      deliveryStatus:  o.deliveryStatus || "pending",
      status:          mapStatus(o.deliveryStatus),
      isQueued:        o.isQueued || false,
      createdAt:       o.createdAt,
      items:           o.items,
      address:         o.address,
      userId:          o.userId,
    }));

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error("GET /my-orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/delivery/my-orders/:orderId/status
───────────────────────────────────────────────────────────────── */
router.patch("/my-orders/:orderId/status", agentAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const agentId    = req.agent.id;

    const validDisplay = ["Picked", "In Transit", "Delivered", "Failed", "Cancelled"];
    if (!validDisplay.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Use: ${validDisplay.join(", ")}` });

    const toEnum = {
      "Picked":     "picked",
      "In Transit": "in-transit",
      "Delivered":  "delivered",
      "Failed":     "cancelled",
      "Cancelled":  "cancelled",
    };
    const deliveryStatus = toEnum[status];

    const order = await Order.findOne({ _id: req.params.orderId, deliveryAgent: agentId });
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });

    order.deliveryStatus = deliveryStatus;
    order.trackingHistory.push({ status: deliveryStatus, time: new Date() });

    if (deliveryStatus === "delivered") {
      order.deliveredAt = new Date();
      order.orderStatus = "DELIVERED";
      order.isQueued    = false;
      order.orderStatusHistory.push({ status: "DELIVERED", timestamp: new Date() });

      // Upsert earnings — prevents duplicate commission on re-call
      try {
        const agent      = await DeliveryAgent.findById(agentId);
        const commission = agent?.commission ?? 7;
        // Use stored deliveryPayout if set, else calculate from commission
        const amount = order.deliveryPayout || Math.round((order.totalAmount || 0) * commission / 100);

        await Earning.findOneAndUpdate(
          { agent: agentId, order: order._id, type: "Commission" },
          { $setOnInsert: { agent: agentId, order: order._id, type: "Commission", amount, isPaid: false, createdAt: new Date() } },
          { upsert: true, new: true }
        );
        await DeliveryAgent.findByIdAndUpdate(agentId, { $inc: { totalDeliveries: 1, thisMonthDeliveries: 1 } });
      } catch (e) { console.error("Earnings upsert:", e); }

      // Activate next queued order
      const next = await Order.findOne({ deliveryAgent: agentId, deliveryStatus: "assigned", isQueued: true }).sort({ createdAt: 1 });
      if (next) {
        next.isQueued = false;
        next.trackingHistory.push({ status: "Activated from queue", time: new Date() });
        await next.save();
      }
    }

    await order.save();
    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (err) {
    console.error("PATCH /my-orders/:id/status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/delivery/my-earnings
───────────────────────────────────────────────────────────────── */
router.get("/my-earnings", agentAuth, async (req, res) => {
  try {
    const agentId        = req.agent.id;
    const { page = 1, limit = 20 } = req.query;

    const [earnings, summary, total] = await Promise.all([
      Earning.find({ agent: agentId })
        .populate("order", "orderId totalAmount address")
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Earning.aggregate([
        { $match: { agent: new mongoose.Types.ObjectId(agentId) } },
        { $group: {
          _id:          null,
          totalEarned:  { $sum: "$amount" },
          totalPaid:    { $sum: { $cond: ["$isPaid", "$amount", 0] } },
          totalPending: { $sum: { $cond: ["$isPaid", 0, "$amount"] } },
          totalCount:   { $sum: 1 },
        }},
      ]),
      Earning.countDocuments({ agent: agentId }),
    ]);

    res.json({ success: true, data: earnings, total, summary: summary[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/delivery/dashboard   (legacy — kept for compatibility)
───────────────────────────────────────────────────────────────── */
router.get("/dashboard", agentAuth, async (req, res) => {
  try {
    const agentId  = req.agent.id;
    const agent    = await DeliveryAgent.findById(agentId).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });

    const allOrders   = await Order.find({ deliveryAgent: agentId }).lean();
    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfMonth());

    const totalDeliveries     = allOrders.filter(o => o.deliveryStatus === "delivered").length;
    const thisMonthDeliveries = monthOrders.filter(o => o.deliveryStatus === "delivered").length;
    const pendingOrders       = allOrders.filter(o => ["assigned","picked","in-transit"].includes(o.deliveryStatus)).length;

    const allEarnings       = await Earning.find({ agent: agentId }).lean();
    const totalEarnings     = allEarnings.reduce((s, e) => s + (e.amount || 0), 0);
    const thisMonthEarnings = allEarnings.filter(e => new Date(e.createdAt) >= startOfMonth()).reduce((s, e) => s + (e.amount || 0), 0);

    res.json({
      success: true,
      data: {
        agent,
        stats: {
          totalDeliveries, thisMonthDeliveries, pendingOrders,
          totalEarnings,   thisMonthEarnings,
          avgRating:       agent.avgRating              ?? 0,
          commission:      agent.commission              ?? 7,
          incentive:       agent.incentive               ?? 400,
          incentiveTarget: agent.incentiveDeliveryTarget ?? 100,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/delivery/my-earnings-detail
   Agent sees their own real paid/pending breakdown from Earning model.
───────────────────────────────────────────────────────────────── */
router.get("/my-earnings-detail", agentAuth, async (req, res) => {
  try {
    const agentId = new mongoose.Types.ObjectId(req.agent.id);
    const { page = 1, limit = 10 } = req.query;

    const [records, summary, total] = await Promise.all([
      Earning.find({ agent: agentId })
        .populate("order", "orderId totalAmount address createdAt deliveredAt")
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean(),

      Earning.aggregate([
        { $match: { agent: agentId } },
        { $group: {
          _id:          null,
          totalEarned:  { $sum: "$amount" },
          totalPaid:    { $sum: { $cond: ["$isPaid", "$amount", 0] } },
          totalPending: { $sum: { $cond: ["$isPaid", 0, "$amount"] } },
          paidCount:    { $sum: { $cond: ["$isPaid", 1, 0] } },
          pendingCount: { $sum: { $cond: ["$isPaid", 0, 1] } },
        }},
      ]),

      Earning.countDocuments({ agent: agentId }),
    ]);

    res.json({
      success: true,
      records,
      total,
      summary: summary[0] || {
        totalEarned: 0, totalPaid: 0, totalPending: 0,
        paidCount: 0,  pendingCount: 0,
      },
    });
  } catch (err) {
    console.error("GET /my-earnings-detail error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/delivery/admin/earnings/sync
   Backfills Earning records for all delivered orders that don't
   have one yet. Safe to call multiple times (upsert, no dupes).
───────────────────────────────────────────────────────────────── */
router.post("/admin/earnings/sync", adminProtect, async (req, res) => {
  try {
    const deliveredOrders = await Order.find({
      deliveryStatus: "delivered",
      deliveryAgent:  { $exists: true, $ne: null },
    }).populate("deliveryAgent", "commission").lean();

    let created = 0, skipped = 0;

    for (const order of deliveredOrders) {
      const agentId    = order.deliveryAgent?._id || order.deliveryAgent;
      const commission = order.deliveryAgent?.commission ?? 7;
      const amount     = order.deliveryPayout || Math.round((order.totalAmount || 0) * commission / 100);

      try {
        const existing = await Earning.findOneAndUpdate(
          { agent: agentId, order: order._id, type: "Commission" },
          { $setOnInsert: {
            agent:     agentId,
            order:     order._id,
            type:      "Commission",
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
    console.error("Sync earnings error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;