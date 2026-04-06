// backend/controllers/deliveryController.js
import DeliveryAgent from "../models/DeliveryAgent.js";
import Order from "../models/Order.js";
import Earning from "../models/Earning.js"; 
import jwt from "jsonwebtoken";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
import {
  notifyRegistrationReceived,
  notifyApproved,
  notifyRejected,
  // notifyDraft,
} from "../services/notificationService.js";

const JWT_SECRET  = process.env.JWT_SECRET || "bioburg_secret_2024";
const JWT_EXPIRES = "7d";

const signToken = (id) =>
  jwt.sign({ id, role: "delivery-agent" }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const safe = (a) => { const o = a.toJSON ? a.toJSON() : { ...a }; delete o.password; return o; };

const FIELD_LABELS = {
  name:           "Full Name",
  phone:          "Mobile Number",
  email:          "Email Address",
  deliveryZone:   "Delivery Zone",
  vehicleType:    "Vehicle Type",
  vehicleNumber:  "Vehicle Registration No.",
  drivingLicence: "Driving Licence No.",
  aadhaar:        "Aadhaar / ID Proof",
  licenceCopy:    "Driving Licence Copy",
  vehicleRC:      "Vehicle RC Document",
  passportPhoto:  "Passport Photo",
  bankName:       "Bank Name",
  accountNumber:  "Account Number",
  ifscCode:       "IFSC Code",
  upiId:          "UPI ID",
  upiQrImage:     "UPI QR Code Image",
};

const ALLOWED_DRAFT_FIELDS = Object.keys(FIELD_LABELS);

// helpers 
const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);


export const register = async (req, res) => {
  try {
    const {
      name, phone, email, password,
      vehicleType, vehicleNumber, drivingLicence, panCard,
      bankAccountNumber, ifscCode, bankName, accountHolderName,
      upiId, assignedArea,
      aadhaarUrl, licenceCopyUrl, vehicleRCUrl, passportPhotoUrl, upiQrImageUrl,
    } = req.body;

    if (await DeliveryAgent.findOne({ phone }))
      return res.status(400).json({ success: false, message: "Phone number already registered" });
    if (await DeliveryAgent.findOne({ email: email?.toLowerCase() }))
      return res.status(400).json({ success: false, message: "Email already registered" });

    const agent = await DeliveryAgent.create({
      name, phone, email: email?.toLowerCase(), password,
      vehicleType, vehicleNumber, drivingLicence, panCard,
      bankDetails: { accountNumber: bankAccountNumber, ifscCode, bankName, accountHolderName: accountHolderName || name },
      upiId: upiId || "",
      assignedArea: assignedArea || "",
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
      message: "Registration submitted! A confirmation email and SMS have been sent to you.",
      agentId: agent.agentId,
    });
  } catch (err) {
    if (err.name === "ValidationError")
      return res.status(400).json({ success: false, message: Object.values(err.errors)[0].message });
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: `${Object.keys(err.keyValue)[0]} already exists` });
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    if (!password || (!phone && !email))
      return res.status(400).json({ success: false, message: "Credentials required" });

    const agent = await DeliveryAgent.findOne(phone ? { phone } : { email: email?.toLowerCase() }).select("+password");
    if (!agent || !(await agent.matchPassword(password)))
      return res.status(401).json({ success: false, message: "Invalid phone/email or password" });

    if (agent.status === "pending")
      return res.status(403).json({ success: false, status: "pending",
        message: "Your application is under review. You will be notified via email & SMS within 24–48 hours." });

    if (agent.status === "draft")
      return res.status(403).json({
        success: false,
        status: "draft",
        message: "Your application needs corrections. Please update the flagged fields.",
        fieldsToRevise: agent.fieldsToRevise,
        draftNote: agent.draftNote,
        agent: safe(agent),
      });

    if (agent.status === "rejected")
      return res.status(403).json({ success: false, status: "rejected",
        message: "Your application was not approved. Contact support@bioburgpharma.com" });
    if (agent.status === "suspended")
      return res.status(403).json({ success: false, status: "suspended",
        message: "Your account has been suspended. Contact admin." });

    res.json({ success: true, token: signToken(agent._id), agent: safe(agent) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const agentId = req.user.id;

    const agent = await DeliveryAgent.findById(agentId).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });

    // ── ALL-TIME stats from Order model ───────────────────────────
    const [allOrders, monthOrders, allEarnings] = await Promise.all([
      Order.find({ deliveryAgent: agentId }),
      Order.find({ deliveryAgent: agentId, createdAt: { $gte: startOfMonth() } }),
      // Earnings collection — total across all time
      Earning.find({ agent: agentId, isPaid: false })
        .then(unpaid => Earning.find({ agent: agentId })
          .then(all => ({ all, unpaid }))
        ).catch(() => ({ all: [], unpaid: [] })),
    ]);

    const totalDeliveries     = allOrders.filter(o => o.deliveryStatus === "delivered").length;
    const thisMonthDeliveries = monthOrders.filter(o => o.deliveryStatus === "delivered").length;

    // Sum ALL earnings records (paid + unpaid) for total
    const totalEarnings     = allEarnings.all.reduce((s, e) => s + (e.amount || 0), 0);
    const thisMonthEarnings = allEarnings.all
      .filter(e => new Date(e.createdAt) >= startOfMonth())
      .reduce((s, e) => s + (e.amount || 0), 0);

    // Current active order (assigned/picked/in-transit, not queued)
    const currentOrderDoc = await Order.findOne({
      deliveryAgent:  agentId,
      deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
      isQueued:       { $ne: true },
    }).select("orderId totalAmount address userId deliveryStatus createdAt").lean();

    const currentOrder = currentOrderDoc
      ? {
          orderId:         currentOrderDoc.orderId || currentOrderDoc._id?.toString().slice(-8).toUpperCase(),
          customerName:    currentOrderDoc.address?.fullName || "—",
          customerAddress: [
            currentOrderDoc.address?.addressLine,
            currentOrderDoc.address?.city,
            currentOrderDoc.address?.state,
            currentOrderDoc.address?.pincode,
          ].filter(Boolean).join(", "),
          orderAmount:     currentOrderDoc.totalAmount || 0,
        }
      : null;

    res.json({
      success: true,
      agent: {
        ...safe(agent),
        isOnline:            agent.availability === "online",
        totalDeliveries,
        thisMonthDeliveries,
        totalEarnings,
        thisMonthEarnings,
        avgRating:           agent.avgRating || 0,
        currentOrder,
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const agentId = req.user.id;

    const orders = await Order.find({ deliveryAgent: agentId })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Map to the shape the agent dashboard expects
    const data = orders.map(o => ({
      _id:             o._id,
      orderId:         o.orderId || o._id?.toString().slice(-8).toUpperCase(),
      customerName:    o.address?.fullName  || o.userId?.name  || "—",
      customerPhone:   o.address?.phone     || o.userId?.phone || "",
      customerAddress: [o.address?.addressLine, o.address?.city, o.address?.state, o.address?.pincode].filter(Boolean).join(", "),
      orderAmount:     o.totalAmount || 0,
      // Keep raw deliveryStatus so the frontend normaliseOrder() can handle both sources
      deliveryStatus:  o.deliveryStatus || "pending",
      status:          mapDeliveryStatus(o.deliveryStatus),
      isQueued:        o.isQueued || false,
      createdAt:       o.createdAt,
      items:           o.items,
      // D2C marker — tells the frontend which update endpoint to use
      userId:          o.userId,
      address:         o.address,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/** Maps DB deliveryStatus enum to the display strings used in the dashboard */
function mapDeliveryStatus(s) {
  const map = {
    pending:      "Assigned",
    assigned:     "Assigned",
    picked:       "Picked",
    "in-transit": "In Transit",
    delivered:    "Delivered",
    cancelled:    "Cancelled",
  };
  return map[s] || "Assigned";
}


export const updateMyOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const agentId    = req.user.id;

    const statusToEnum = {
      "Picked":      "picked",
      "In Transit":  "in-transit",
      "Delivered":   "delivered",
      "Failed":      "cancelled",
      "Cancelled":   "cancelled",
    };

    const deliveryStatus = statusToEnum[status];
    if (!deliveryStatus) return res.status(400).json({ success: false, message: "Invalid status" });

    const order = await Order.findOne({ _id: req.params.id, deliveryAgent: agentId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.deliveryStatus = deliveryStatus;
    order.trackingHistory.push({ status: deliveryStatus, time: new Date() });

    if (deliveryStatus === "delivered") {
      order.deliveredAt = new Date();
      order.orderStatus = "DELIVERED";
      order.isQueued    = false;
      order.orderStatusHistory.push({ status: "DELIVERED", timestamp: new Date() });

      // ── Upsert earnings — prevents duplicates ─────────────────
      try {
        const agent      = await DeliveryAgent.findById(agentId);
        const commission = agent?.commission ?? 7;
        const amount     = Math.round((order.totalAmount || 0) * commission / 100);

        await Earning.findOneAndUpdate(
          { agent: agentId, order: order._id, type: "Commission" },
          { $setOnInsert: { agent: agentId, order: order._id, type: "Commission", amount, isPaid: false, createdAt: new Date() } },
          { upsert: true, new: true }
        );

        await DeliveryAgent.findByIdAndUpdate(agentId, {
          $inc: { totalDeliveries: 1, thisMonthDeliveries: 1 },
        });
      } catch (e) { console.error("Earnings upsert:", e); }

      // ── Activate next queued order for this agent ──────────────
      const nextQueued = await Order.findOne({
        deliveryAgent:  agentId,
        deliveryStatus: "assigned",
        isQueued:       true,
      }).sort({ createdAt: 1 });

      if (nextQueued) {
        nextQueued.isQueued = false;
        nextQueued.trackingHistory.push({ status: "Activated from queue", time: new Date() });
        await nextQueued.save();
      }
    }

    await order.save();
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    console.error("updateMyOrderStatus error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PATCH /api/delivery/toggle-online
 */
export const toggleOnlineStatus = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });
    agent.availability = agent.availability === "online" ? "offline" : "online";
    await agent.save();
    res.json({
      success: true,
      availability: agent.availability,
      message: agent.availability === "online" ? "You are now ONLINE" : "You are now OFFLINE",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await DeliveryAgent.findByIdAndUpdate(req.user.id, {
      "location.lat": lat, "location.lng": lng, "location.updatedAt": new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════════
   ADMIN ROUTES
══════════════════════════════════════════════════════════════════ */

export const adminGetAll = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const q = {};
    if (status && status !== "all") q.status = status;
    if (search) {
      q.$or = [
        { name:          { $regex: search, $options: "i" } },
        { phone:         { $regex: search, $options: "i" } },
        { email:         { $regex: search, $options: "i" } },
        { agentId:       { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      DeliveryAgent.find(q).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      DeliveryAgent.countDocuments(q),
    ]);
    const agg = await DeliveryAgent.aggregate([{ $group: { _id: "$status", c: { $sum: 1 } } }]);
    const counts = { pending: 0, approved: 0, rejected: 0, suspended: 0, draft: 0 };
    agg.forEach(({ _id, c }) => { if (_id) counts[_id] = c; });
    res.json({ success: true, agents: data, data, total, page: +page, pages: Math.ceil(total / +limit), counts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminGetStats = async (req, res) => {
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
    const [agg] = await DeliveryAgent.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, earnings: { $sum: "$totalEarnings" }, deliveries: { $sum: "$totalDeliveries" } } },
    ]);
    // Total deliveries from Order model (source of truth)
    const totalDeliveries = await Order.countDocuments({ deliveryStatus: "delivered" });

    res.json({
      success: true,
      stats: { total, approved, pending, rejected, suspended, draft, online, totalEarnings: agg?.earnings || 0, totalDeliveries },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminGetOnline = async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({ availability: "online", status: "approved" })
      .select("agentId name phone assignedArea location availability currentOrder totalDeliveries vehicleType vehicleNumber");

    // Enrich each agent with their current active order from Order model
    const enriched = await Promise.all(agents.map(async a => {
      const activeOrder = await Order.findOne({
        deliveryAgent:  a._id,
        deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
        isQueued:       { $ne: true },
      }).select("orderId totalAmount address deliveryStatus").lean();

      return {
        ...a.toObject(),
        currentOrder: activeOrder || null,
      };
    }));

    res.json({ success: true, agents: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminGetOne = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminApprove = async (req, res) => {
  try {
    const { commission, incentive, incentiveDeliveryTarget } = req.body;
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved", approvalNote: "Approved by admin",
        approvedBy: req.user?.id || null, approvedAt: new Date(),
        fieldsToRevise: [], draftNote: "", draftSentAt: null,
        ...(commission              && { commission:              +commission }),
        ...(incentive               && { incentive:               +incentive }),
        ...(incentiveDeliveryTarget && { incentiveDeliveryTarget: +incentiveDeliveryTarget }),
      },
      { new: true }
    ).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });
    notifyApproved({ name: agent.name, email: agent.email, phone: agent.phone, agentId: agent.agentId }).catch(console.error);
    res.json({ success: true, message: `${agent.name} approved! Email & SMS sent.`, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminReject = async (req, res) => {
  try {
    const { reason } = req.body;
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", approvalNote: reason || "Rejected by admin", rejectionReason: reason || "" },
      { new: true }
    ).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });
    notifyRejected({ name: agent.name, email: agent.email, phone: agent.phone, reason }).catch(console.error);
    res.json({ success: true, message: "Agent rejected. Email & SMS sent.", data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminSuspend = async (req, res) => {
  try {
    const { reason } = req.body;
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { status: "suspended", approvalNote: reason || "Suspended by admin", availability: "offline" },
      { new: true }
    ).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Agent suspended", data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminReactivate = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvalNote: "Reactivated by admin" },
      { new: true }
    ).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });
    notifyApproved({ name: agent.name, email: agent.email, phone: agent.phone, agentId: agent.agentId }).catch(console.error);
    res.json({ success: true, message: "Agent reactivated. Email & SMS sent.", data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminUpdateCommission = async (req, res) => {
  try {
    const { commission, incentive, incentiveDeliveryTarget } = req.body;
    const update = {};
    if (commission              !== undefined) update.commission              = +commission;
    if (incentive               !== undefined) update.incentive               = +incentive;
    if (incentiveDeliveryTarget !== undefined) update.incentiveDeliveryTarget = +incentiveDeliveryTarget;
    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Commission updated", data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminAssignOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent)                          return res.status(404).json({ success: false, message: "Not found" });
    if (agent.status !== "approved")     return res.status(400).json({ success: false, message: "Agent not approved" });
    if (agent.availability !== "online") return res.status(400).json({ success: false, message: "Agent is offline" });
    await DeliveryAgent.findByIdAndUpdate(req.params.id, { currentOrder: orderId });
    res.json({ success: true, message: `Order assigned to ${agent.name}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminDraft = async (req, res) => {
  try {
    const { fieldsToRevise, adminNote } = req.body;

    if (!fieldsToRevise || !Array.isArray(fieldsToRevise) || fieldsToRevise.length === 0)
      return res.status(400).json({ success: false, message: "Select at least one field to flag for revision." });

    const invalid = fieldsToRevise.filter(f => !ALLOWED_DRAFT_FIELDS.includes(f));
    if (invalid.length > 0)
      return res.status(400).json({ success: false, message: `Invalid field keys: ${invalid.join(", ")}` });

    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found." });

    if (!["pending", "draft"].includes(agent.status))
      return res.status(400).json({ success: false, message: `Cannot send draft to an agent with status "${agent.status}".` });

    agent.status         = "draft";
    agent.fieldsToRevise = fieldsToRevise;
    agent.draftNote      = adminNote || "";
    agent.draftSentAt    = new Date();
    await agent.save();

    const fieldLabels = fieldsToRevise.map(k => FIELD_LABELS[k] || k).join(", ");
    notifyDraft({ name: agent.name, email: agent.email, phone: agent.phone, fieldLabels, adminNote: adminNote || "" }).catch(console.error);

    res.json({
      success: true,
      message: `Draft sent to ${agent.name}. ${fieldsToRevise.length} field(s) flagged. Email & SMS sent.`,
      data: agent,
    });
  } catch (err) {
    console.error("adminDraft error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

export const adminDeleteAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: "Not found" });

    if (agent.currentOrder)
      return res.status(400).json({ success: false, message: "Cannot delete agent with an active delivery order. Reassign it first." });

    if (agent.documents) {
      await Promise.all(
        Object.values(agent.documents)
          .filter(Boolean)
          .map((url) => {
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
            const publicId = match?.[1];
            if (!publicId) return Promise.resolve();
            return deleteFromCloudinary(publicId, "image").catch(() => {});
          })
      );
    }

    await DeliveryAgent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Agent "${agent.name}" (${agent.agentId}) permanently deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};