import jwt from "jsonwebtoken";
import DeliveryAgent from "../models/DeliveryAgent.js";
import Order from "../models/Order.js";
import Earning from "../models/Earning.js";
import EmployeeIDCard from "../models/employeeIdCards.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
import {
  notifyRegistrationReceived,
  notifyApproved,
  notifyRejected,
  notifyDraft,
} from "../services/notificationService.js";

const JWT_SECRET = process.env.JWT_SECRET || "bioburg_secret_2024";
const JWT_EXPIRES = "7d";

const signToken = (id) =>
  jwt.sign({ id, role: "delivery-agent" }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const safe = (agent) => {
  const obj = agent.toJSON ? agent.toJSON() : { ...agent };
  delete obj.password;
  return obj;
};

const FIELD_LABELS = {
  name: "Full Name",
  phone: "Mobile Number",
  email: "Email Address",
  deliveryZone: "Delivery Zone",
  vehicleType: "Vehicle Type",
  vehicleNumber: "Vehicle Registration No.",
  drivingLicence: "Driving Licence No.",
  aadhaar: "Aadhaar / ID Proof",
  personalInsurance: "Personal Insurance",
  licenceCopy: "Driving Licence Copy",
  vehicleRC: "Vehicle RC Document",
  vehicleInsurance: "Vehicle Insurance",
  passportPhoto: "Passport Photo",
  bankName: "Bank Name",
  accountNumber: "Account Number",
  ifscCode: "IFSC Code",
  upiId: "UPI ID",
  upiQrImage: "UPI QR Code Image",
};

const ALLOWED_DRAFT_FIELDS = Object.keys(FIELD_LABELS);

const startOfMonth = () =>
  new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function mapDeliveryStatus(status) {
  const map = {
    pending: "Assigned",
    assigned: "Assigned",
    picked: "Picked",
    "in-transit": "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return map[status] || "Assigned";
}

const getDriverIDCard = (agentId) =>
  EmployeeIDCard.findOne({
    employeeRef: agentId,
    sourceModel: "DeliveryAgent",
    isActive: true,
  })
    .sort({ issuedAt: -1 })
    .lean();

export const register = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      vehicleType,
      vehicleNumber,
      drivingLicence,
      panCard,
      panNumber,
      personalInsuranceNumber,
      vehicleInsuranceNumber,
      bankAccountNumber,
      bankAccount,
      ifscCode,
      ifsc,
      bankName,
      accountHolderName,
      upiId,
      assignedArea,
      zone,
      aadhaarUrl,
      personalInsuranceUrl,
      licenceCopyUrl,
      vehicleRCUrl,
      vehicleInsuranceUrl,
      passportPhotoUrl,
      upiQrImageUrl,
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and password are required",
      });
    }

    if (await DeliveryAgent.findOne({ phone })) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    if (email && (await DeliveryAgent.findOne({ email: email.toLowerCase() }))) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const agent = await DeliveryAgent.create({
      name,
      phone,
      email: email?.toLowerCase() || "",
      password,
      vehicleType: vehicleType?.toLowerCase() || "bike",
      vehicleNumber: vehicleNumber || "",
      drivingLicence: drivingLicence || "",
      panCard: panCard || panNumber || "",
      personalInsuranceNumber: personalInsuranceNumber || "",
      vehicleInsuranceNumber: vehicleInsuranceNumber || "",
      bankDetails: {
        accountNumber: bankAccountNumber || bankAccount || "",
        ifscCode: ifscCode || ifsc || "",
        bankName: bankName || "",
        accountHolderName: accountHolderName || name,
      },
      upiId: upiId || "",
      assignedArea: assignedArea || zone || "",
      documents: {
        aadhaar: aadhaarUrl || null,
        personalInsurance: personalInsuranceUrl || null,
        licenceCopy: licenceCopyUrl || null,
        vehicleRC: vehicleRCUrl || null,
        vehicleInsurance: vehicleInsuranceUrl || null,
        passportPhoto: passportPhotoUrl || null,
        upiQrImage: upiQrImageUrl || null,
      },
      status: "pending",
    });

    notifyRegistrationReceived({ name, email, phone }).catch(console.error);

    return res.status(201).json({
      success: true,
      message: "Registration submitted! A confirmation email and SMS have been sent to you.",
      agentId: agent.agentId,
      id: agent._id,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)[0].message,
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `${Object.keys(err.keyValue)[0]} already exists`,
      });
    }

    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if (!password || (!phone && !email)) {
      return res.status(400).json({
        success: false,
        message: "Credentials required",
      });
    }

    const agent = await DeliveryAgent.findOne(
      phone ? { phone } : { email: email?.toLowerCase() }
    ).select("+password");

    if (!agent || !(await agent.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone/email or password",
      });
    }

    if (agent.status === "pending") {
      return res.status(403).json({
        success: false,
        status: "pending",
        message: "Your application is under review. You will be notified via email & SMS within 24-48 hours.",
      });
    }

    if (agent.status === "draft") {
      return res.status(403).json({
        success: false,
        status: "draft",
        message: "Your application needs corrections. Please update the flagged fields.",
        fieldsToRevise: agent.fieldsToRevise,
        draftNote: agent.draftNote,
        agent: safe(agent),
      });
    }

    if (agent.status === "rejected") {
      return res.status(403).json({
        success: false,
        status: "rejected",
        message: "Your application was not approved. Contact support@bioburgpharma.com",
      });
    }

    if (agent.status === "suspended") {
      return res.status(403).json({
        success: false,
        status: "suspended",
        message: "Your account has been suspended. Contact admin.",
      });
    }

    return res.json({
      success: true,
      token: signToken(agent._id),
      agent: safe(agent),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const agentId = req.user.id;

    const [agent, idCard] = await Promise.all([
      DeliveryAgent.findById(agentId).select("-password"),
      getDriverIDCard(agentId),
    ]);

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const [allOrders, monthOrders, allEarnings, currentOrderDoc] = await Promise.all([
      Order.find({ deliveryAgent: agentId }).lean(),
      Order.find({ deliveryAgent: agentId, createdAt: { $gte: startOfMonth() } }).lean(),
      Earning.find({ agent: agentId }).lean(),
      Order.findOne({
        deliveryAgent: agentId,
        deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
        isQueued: { $ne: true },
      })
        .select("orderId totalAmount address userId deliveryStatus createdAt deliveryPayout")
        .lean(),
    ]);

    const totalDeliveries = allOrders.filter((o) => o.deliveryStatus === "delivered").length;
    const thisMonthDeliveries = monthOrders.filter((o) => o.deliveryStatus === "delivered").length;

    const totalEarnings = allEarnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
    const thisMonthEarnings = allEarnings
      .filter((earning) => new Date(earning.createdAt) >= startOfMonth())
      .reduce((sum, earning) => sum + (earning.amount || 0), 0);

    const currentOrder = currentOrderDoc
      ? {
          orderId: currentOrderDoc.orderId || currentOrderDoc._id?.toString().slice(-8).toUpperCase(),
          customerName: currentOrderDoc.address?.fullName || "-",
          customerAddress: [
            currentOrderDoc.address?.addressLine,
            currentOrderDoc.address?.city,
            currentOrderDoc.address?.state,
            currentOrderDoc.address?.pincode,
          ]
            .filter(Boolean)
            .join(", "),
          orderAmount: currentOrderDoc.totalAmount || 0,
          deliveryPayout: currentOrderDoc.deliveryPayout || 0,
          status: mapDeliveryStatus(currentOrderDoc.deliveryStatus),
        }
      : null;

    return res.json({
      success: true,
      agent: {
        ...safe(agent),
        idCard,
        isOnline: agent.availability === "online",
        totalDeliveries,
        thisMonthDeliveries,
        totalEarnings,
        thisMonthEarnings,
        avgRating: agent.avgRating || 0,
        commission: agent.commission ?? 7,
        incentive: agent.incentive ?? 400,
        incentiveDeliveryTarget: agent.incentiveDeliveryTarget ?? 100,
        currentOrder,
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const agentId = req.user.id;

    const orders = await Order.find({ deliveryAgent: agentId })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const data = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderId || order._id?.toString().slice(-8).toUpperCase(),
      customerName: order.address?.fullName || order.userId?.name || "-",
      customerPhone: order.address?.phone || order.userId?.phone || "",
      customerAddress: [
        order.address?.addressLine,
        order.address?.city,
        order.address?.state,
        order.address?.pincode,
      ]
        .filter(Boolean)
        .join(", "),
      orderAmount: order.totalAmount || 0,
      deliveryPayout: order.deliveryPayout || 0,
      deliveryStatus: order.deliveryStatus || "pending",
      status: mapDeliveryStatus(order.deliveryStatus),
      isQueued: order.isQueued || false,
      createdAt: order.createdAt,
      items: order.items,
      userId: order.userId,
      address: order.address,
    }));

    return res.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateMyOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const agentId = req.user.id;

    const statusToEnum = {
      Picked: "picked",
      "In Transit": "in-transit",
      Delivered: "delivered",
      Failed: "cancelled",
      Cancelled: "cancelled",
    };

    const deliveryStatus = statusToEnum[status];

    if (!deliveryStatus) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findOne({
      _id: req.params.id || req.params.orderId,
      deliveryAgent: agentId,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.deliveryStatus = deliveryStatus;
    order.trackingHistory.push({ status: deliveryStatus, time: new Date() });

    if (deliveryStatus === "delivered") {
      order.deliveredAt = new Date();
      order.orderStatus = "DELIVERED";
      order.isQueued = false;
      order.orderStatusHistory.push({ status: "DELIVERED", timestamp: new Date() });

      try {
        const agent = await DeliveryAgent.findById(agentId);
        const commission = agent?.commission ?? 7;
        const amount =
          order.deliveryPayout ||
          Math.round((order.totalAmount || 0) * commission / 100);

        await Earning.findOneAndUpdate(
          { agent: agentId, order: order._id, type: "Commission" },
          {
            $setOnInsert: {
              agent: agentId,
              order: order._id,
              type: "Commission",
              amount,
              isPaid: false,
              createdAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );

        await DeliveryAgent.findByIdAndUpdate(agentId, {
          $inc: { totalDeliveries: 1, thisMonthDeliveries: 1 },
        });
      } catch (err) {
        console.error("Earnings upsert:", err);
      }

      const nextQueued = await Order.findOne({
        deliveryAgent: agentId,
        deliveryStatus: "assigned",
        isQueued: true,
      }).sort({ createdAt: 1 });

      if (nextQueued) {
        nextQueued.isQueued = false;
        nextQueued.trackingHistory.push({
          status: "Activated from queue",
          time: new Date(),
        });
        await nextQueued.save();
      }
    }

    await order.save();

    return res.json({
      success: true,
      message: `Status updated to ${status}`,
    });
  } catch (err) {
    console.error("updateMyOrderStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const toggleOnlineStatus = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.user.id);

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    agent.availability = agent.availability === "online" ? "offline" : "online";
    await agent.save();

    return res.json({
      success: true,
      availability: agent.availability,
      message:
        agent.availability === "online"
          ? "You are now ONLINE"
          : "You are now OFFLINE",
    });
  } catch (err) {
    console.error("toggleOnlineStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    await DeliveryAgent.findByIdAndUpdate(req.user.id, {
      "location.lat": lat,
      "location.lng": lng,
      "location.updatedAt": new Date(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("updateLocation error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyEarningsDetail = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const [records, summary, total] = await Promise.all([
      Earning.find({ agent: agentId })
        .populate("order", "orderId totalAmount address createdAt deliveredAt")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),

      Earning.aggregate([
        { $match: { agent: agentId } },
        {
          $group: {
            _id: null,
            totalEarned: { $sum: "$amount" },
            totalPaid: { $sum: { $cond: ["$isPaid", "$amount", 0] } },
            totalPending: { $sum: { $cond: ["$isPaid", 0, "$amount"] } },
            paidCount: { $sum: { $cond: ["$isPaid", 1, 0] } },
            pendingCount: { $sum: { $cond: ["$isPaid", 0, 1] } },
          },
        },
      ]),

      Earning.countDocuments({ agent: agentId }),
    ]);

    return res.json({
      success: true,
      records,
      total,
      summary: summary[0] || {
        totalEarned: 0,
        totalPaid: 0,
        totalPending: 0,
        paidCount: 0,
        pendingCount: 0,
      },
    });
  } catch (err) {
    console.error("getMyEarningsDetail error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminGetAll = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;

    const q = {};

    if (status && status !== "all") q.status = status;

    if (search) {
      q.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { agentId: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total, agg] = await Promise.all([
      DeliveryAgent.find(q)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DeliveryAgent.countDocuments(q),
      DeliveryAgent.aggregate([{ $group: { _id: "$status", c: { $sum: 1 } } }]),
    ]);

    const counts = { pending: 0, approved: 0, rejected: 0, suspended: 0, draft: 0 };
    agg.forEach(({ _id, c }) => {
      if (_id) counts[_id] = c;
    });

    return res.json({
      success: true,
      agents: data,
      data,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      counts,
    });
  } catch (err) {
    console.error("adminGetAll error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminGetStats = async (req, res) => {
  try {
    const [total, approved, pending, rejected, suspended, draft, online] =
      await Promise.all([
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
      {
        $group: {
          _id: null,
          earnings: { $sum: "$totalEarnings" },
          deliveries: { $sum: "$totalDeliveries" },
        },
      },
    ]);

    const totalDeliveries = await Order.countDocuments({
      deliveryStatus: "delivered",
    });

    return res.json({
      success: true,
      stats: {
        total,
        approved,
        pending,
        rejected,
        suspended,
        draft,
        online,
        totalEarnings: agg?.earnings || 0,
        totalDeliveries,
      },
    });
  } catch (err) {
    console.error("adminGetStats error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminGetOnline = async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({
      availability: "online",
      status: "approved",
    }).select(
      "agentId name phone assignedArea location availability currentOrder totalDeliveries vehicleType vehicleNumber"
    );

    const enriched = await Promise.all(
      agents.map(async (agent) => {
        const activeOrder = await Order.findOne({
          deliveryAgent: agent._id,
          deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
          isQueued: { $ne: true },
        })
          .select("orderId totalAmount address deliveryStatus deliveryPayout")
          .lean();

        return {
          ...agent.toObject(),
          currentOrder: activeOrder
            ? {
                orderId:
                  activeOrder.orderId ||
                  activeOrder._id.toString().slice(-8).toUpperCase(),
                amount: activeOrder.totalAmount || 0,
                payout: activeOrder.deliveryPayout || 0,
                status: activeOrder.deliveryStatus,
                destination:
                  [
                    activeOrder.address?.addressLine,
                    activeOrder.address?.city,
                    activeOrder.address?.state,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-",
              }
            : null,
        };
      })
    );

    return res.json({
      success: true,
      agents: enriched,
      count: enriched.length,
    });
  } catch (err) {
    console.error("adminGetOnline error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminGetLocations = async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({
      status: "approved",
      availability: "online",
    })
      .select("agentId name phone vehicleType location availability")
      .lean();

    const enriched = await Promise.all(
      agents.map(async (agent) => {
        const activeOrder = await Order.findOne({
          deliveryAgent: agent._id,
          deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
          isQueued: { $ne: true },
        })
          .select("orderId totalAmount address deliveryStatus deliveryPayout")
          .lean();

        return {
          ...agent,
          currentOrder: activeOrder
            ? {
                orderId:
                  activeOrder.orderId ||
                  activeOrder._id.toString().slice(-8).toUpperCase(),
                amount: activeOrder.totalAmount || 0,
                payout: activeOrder.deliveryPayout || 0,
                deliveryStatus: activeOrder.deliveryStatus,
                destination:
                  [
                    activeOrder.address?.addressLine,
                    activeOrder.address?.city,
                    activeOrder.address?.state,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-",
              }
            : null,
        };
      })
    );

    return res.json({ success: true, agents: enriched });
  } catch (err) {
    console.error("adminGetLocations error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminGetOne = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id).select("-password");

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const idCard = await getDriverIDCard(agent._id);

    return res.json({
      success: true,
      data: {
        ...safe(agent),
        idCard,
      },
    });
  } catch (err) {
    console.error("adminGetOne error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminApprove = async (req, res) => {
  try {
    const { commission, incentive, incentiveDeliveryTarget } = req.body;

    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvalNote: "Approved by admin",
        approvedBy: req.user?.id || null,
        approvedAt: new Date(),
        fieldsToRevise: [],
        draftNote: "",
        draftSentAt: null,
        ...(commission !== undefined && { commission: Number(commission) }),
        ...(incentive !== undefined && { incentive: Number(incentive) }),
        ...(incentiveDeliveryTarget !== undefined && {
          incentiveDeliveryTarget: Number(incentiveDeliveryTarget),
        }),
      },
      { new: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    notifyApproved({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      agentId: agent.agentId,
    }).catch(console.error);

    return res.json({
      success: true,
      message: `${agent.name} approved! Email & SMS sent.`,
      data: agent,
    });
  } catch (err) {
    console.error("adminApprove error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminReject = async (req, res) => {
  try {
    const { reason } = req.body;

    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        approvalNote: reason || "Rejected by admin",
        rejectionReason: reason || "",
      },
      { new: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    notifyRejected({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      reason,
    }).catch(console.error);

    return res.json({
      success: true,
      message: "Agent rejected. Email & SMS sent.",
      data: agent,
    });
  } catch (err) {
    console.error("adminReject error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminSuspend = async (req, res) => {
  try {
    const { reason } = req.body;

    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      {
        status: "suspended",
        approvalNote: reason || "Suspended by admin",
        availability: "offline",
      },
      { new: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    return res.json({
      success: true,
      message: "Agent suspended",
      data: agent,
    });
  } catch (err) {
    console.error("adminSuspend error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminReactivate = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvalNote: "Reactivated by admin",
      },
      { new: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    notifyApproved({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      agentId: agent.agentId,
    }).catch(console.error);

    return res.json({
      success: true,
      message: "Agent reactivated. Email & SMS sent.",
      data: agent,
    });
  } catch (err) {
    console.error("adminReactivate error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminUpdateCommission = async (req, res) => {
  try {
    const { commission, incentive, incentiveDeliveryTarget } = req.body;

    const update = {};

    if (commission !== undefined) update.commission = Number(commission);
    if (incentive !== undefined) update.incentive = Number(incentive);
    if (incentiveDeliveryTarget !== undefined) {
      update.incentiveDeliveryTarget = Number(incentiveDeliveryTarget);
    }

    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).select("-password");

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    return res.json({
      success: true,
      message: "Commission updated",
      data: agent,
    });
  } catch (err) {
    console.error("adminUpdateCommission error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminAssignOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const agent = await DeliveryAgent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (agent.status !== "approved") {
      return res.status(400).json({ success: false, message: "Agent not approved" });
    }

    if (agent.availability !== "online") {
      return res.status(400).json({ success: false, message: "Agent is offline" });
    }

    await DeliveryAgent.findByIdAndUpdate(req.params.id, {
      currentOrder: orderId,
    });

    return res.json({
      success: true,
      message: `Order assigned to ${agent.name}`,
    });
  } catch (err) {
    console.error("adminAssignOrder error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminDraft = async (req, res) => {
  try {
    const { fieldsToRevise, adminNote } = req.body;

    if (!fieldsToRevise || !Array.isArray(fieldsToRevise) || fieldsToRevise.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one field to flag for revision.",
      });
    }

    const invalid = fieldsToRevise.filter((field) => !ALLOWED_DRAFT_FIELDS.includes(field));

    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid field keys: ${invalid.join(", ")}`,
      });
    }

    const agent = await DeliveryAgent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found." });
    }

    if (!["pending", "draft"].includes(agent.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot send draft to an agent with status "${agent.status}".`,
      });
    }

    agent.status = "draft";
    agent.fieldsToRevise = fieldsToRevise;
    agent.draftNote = adminNote || "";
    agent.draftSentAt = new Date();

    await agent.save();

    const fieldLabels = fieldsToRevise
      .map((key) => FIELD_LABELS[key] || key)
      .join(", ");

    notifyDraft({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      fieldLabels,
      adminNote: adminNote || "",
    }).catch(console.error);

    return res.json({
      success: true,
      message: `Draft sent to ${agent.name}. ${fieldsToRevise.length} field(s) flagged. Email & SMS sent.`,
      data: agent,
    });
  } catch (err) {
    console.error("adminDraft error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export const adminDeleteAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (agent.currentOrder) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete agent with an active delivery order. Reassign it first.",
      });
    }

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

    return res.json({
      success: true,
      message: `Agent "${agent.name}" (${agent.agentId}) permanently deleted.`,
    });
  } catch (err) {
    console.error("adminDeleteAgent error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyIdCard = async (req, res) => {
  try {
    const card = await EmployeeIDCard.findOne({
      employeeRef: req.user.id,
      sourceModel: "DeliveryAgent",
      isActive: true,
    })
      .sort({ issuedAt: -1 })
      .lean();

    return res.json({ success: true, card: card || null });
  } catch (err) {
    console.error("getMyIdCard error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyIdCardCorrections = async (req, res) => {
  try {
    const card = await EmployeeIDCard.findOne({
      employeeRef: req.user.id,
      sourceModel: "DeliveryAgent",
    }).sort({ createdAt: -1 });

    if (!card) {
      return res.status(404).json({
        success: false,
        corrections: [],
      });
    }

    return res.json({
      success: true,
      corrections: card.corrections || [],
    });
  } catch (err) {
    console.error("getMyIdCardCorrections error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};