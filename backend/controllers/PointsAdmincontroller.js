// controllers/pointsAdminController.js
import mongoose from "mongoose";
import AgentPoints from "../models/Agentpoints.js";
import PointsConfig from "../models/Pointsconfig.js";
import PayoutRequest from "../models/Payoutrequest.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

//GET /api/points/admin/config 
export const getPointsConfigs = async (req, res) => {
  try {
    const configs = await PointsConfig.find().sort({ taskKey: 1 }).lean();
    return res.json({ success: true, data: configs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/points/admin/config 
export const upsertPointsConfig = async (req, res) => {
  try {
    const { taskKey, taskLabel, points, description, isActive } = req.body;
    if (!taskKey || !taskLabel || points === undefined) {
      return res.status(400).json({ success: false, message: "taskKey, taskLabel, and points are required" });
    }

    const config = await PointsConfig.findOneAndUpdate(
      { taskKey },
      { taskKey, taskLabel, points: Number(points), description, isActive: isActive ?? true },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: config });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/points/admin/config/:taskKey 
export const deletePointsConfig = async (req, res) => {
  try {
    await PointsConfig.findOneAndDelete({ taskKey: req.params.taskKey });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  GET /api/points/admin/payouts 
export const getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = status && status !== "all" ? { status } : {};

    const payouts = await PayoutRequest.find(filter)
      .populate("agentId", "name phone email")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await PayoutRequest.countDocuments(filter);

    return res.json({ success: true, data: payouts, total });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  PATCH /api/points/admin/payouts/:id 
export const updatePayoutStatus = async (req, res) => {
  try {
    const {
      status, adminNote, transactionId,deductions,
      // Slip fields
      companyName, companyLogo, companyAddress, companyPhone,
      companyEmail, companyGST, companyWebsite,
      slipTitle, slipNote, adminSignature, designation, paymentMode,
    } = req.body;
    const payout = await PayoutRequest.findById(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: "Payout request not found" });

    const allowedTransitions = {
      pending: ["approved", "rejected"],
      approved: ["paid", "rejected"],
    };
    if (!allowedTransitions[payout.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${payout.status}' to '${status}'`,
      });
    }

    // Refund points if rejecting
    if (status === "rejected") {
      await AgentPoints.create({
        agentId: payout.agentId,
        taskKey: "payout_refund",
        taskLabel: "Payout Rejected – Refund",
        points: payout.pointsRedeemed,
        referenceId: payout._id.toString(),
        referenceModel: "PayoutRequest",
        note: adminNote
          ? `Payout rejected: ${adminNote}`
          : `Payout #${payout._id} rejected — points refunded`,
        addedBy: "admin",
      });
    }

    payout.status = status;
    if (adminNote)       payout.adminNote     = adminNote;
    if (transactionId)   payout.transactionId = transactionId;
    payout.processedAt = new Date();
    await payout.save();

    if (!payout.agentName && payout.agentId) {
  const MarketingAgent = (await import("../models/MarketingAgent.model.js")).default;
  const agent = await MarketingAgent.findById(payout.agentId).select("name phone").lean();
  if (agent) {
    payout.agentName  = agent.name;
    payout.agentPhone = agent.phone;
  }
}
    // Generate slip when marking as paid
    if (status === "paid") {
  const PayoutSlip = (await import("../models/payoutSlip.js")).default;
  const deductions = req.body.deductions || [];  // [{category, amount, note}]
  const totalDeductions = deductions.reduce((s, d) => s + Number(d.amount || 0), 0);
  const netAmount = payout.amountRequested - totalDeductions;

  await PayoutSlip.findOneAndUpdate(
    { payoutId: payout._id },
    {
      payoutId:       payout._id,
      agentId:        payout.agentId,
      agentName:      payout.agentName  || "",
      agentPhone:     payout.agentPhone || "",
      amount:         payout.amountRequested,
      deductions,
      netAmount,
      pointsRedeemed: payout.pointsRedeemed || 0,
      salaryAmount:   payout.salaryAmount   || 0,
      transactionId:  transactionId || "",
      paidOn:         new Date(),
      paymentMode:    paymentMode    || "Bank Transfer",
      companyName:    companyName    || "BioBurg Lifesciences Pvt. Ltd.",
      companyLogo:    companyLogo    || "",
      companyAddress: companyAddress || "",
      companyPhone:   companyPhone   || "",
      companyEmail:   companyEmail   || "",
      companyGST:     companyGST     || "",
      companyWebsite: companyWebsite || "",
      slipTitle:      slipTitle      || "Payment Receipt",
      slipNote:       slipNote       || "",
      adminSignature: adminSignature || "",
      designation:    designation    || "Authorized Signatory",
      isVisible:      true,
      lastEditedAt:   new Date(),
    },
    { upsert: true, new: true }
  );
}
    return res.json({ success: true, data: payout });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  POST /api/points/admin/award 
export const manuallyAwardPoints = async (req, res) => {
  try {
    const { agentId, taskKey, points, note } = req.body;
    if (!agentId || !taskKey || !points) {
      return res.status(400).json({ success: false, message: "agentId, taskKey, and points are required" });
    }

    const config = await PointsConfig.findOne({ taskKey }).lean();

    const entry = await AgentPoints.create({
      agentId,
      taskKey,
      taskLabel: config?.taskLabel || taskKey,
      points: Number(points),
      note: note || `Manually awarded by admin`,
      addedBy: "admin",
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  GET /api/points/admin/agents 
export const getAgentPointsSummaries = async (req, res) => {
  try {
    // 1. Get ALL approved agents
    const agents = await MarketingAgent.find({ isApproved: true })
      .select("_id name phone email")
      .lean();

    // 2. Get points data for those agents
    const agentIds = agents.map((a) => a._id);
    const pointsSummaries = await AgentPoints.aggregate([
      { $match: { agentId: { $in: agentIds } } },
      {
        $group: {
          _id: "$agentId",
          totalPoints: { $sum: "$points" },
          totalEarned: {
            $sum: { $cond: [{ $gt: ["$points", 0] }, "$points", 0] },
          },
          totalRedeemed: {
            $sum: { $cond: [{ $lt: ["$points", 0] }, { $abs: "$points" }, 0] },
          },
          lastActivity: { $max: "$createdAt" },
        },
      },
    ]);

    // 3. Map points data by agentId for quick lookup
    const pointsMap = {};
    pointsSummaries.forEach((s) => {
      pointsMap[s._id.toString()] = s;
    });

    // 4. Merge — agents with no points get zeros
    const result = agents.map((a) => {
      const pts = pointsMap[a._id.toString()];
      return {
        agentId: a._id,
        name: a.name,
        phone: a.phone,
        email: a.email,
        totalPoints: pts?.totalPoints ?? 0,
        totalEarned: pts?.totalEarned ?? 0,
        totalRedeemed: pts?.totalRedeemed ?? 0,
        lastActivity: pts?.lastActivity ?? null,
      };
    });

    // 5. Sort by points descending
    result.sort((a, b) => b.totalPoints - a.totalPoints);

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/points/admin/leads 
export const getAdminLeads = async (req, res) => {
  try {
    const {
      status,
      agentId,
      hasOrder,
      search,
      page = 1,
      limit = 100,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    let AgentResponse;
    try {
      AgentResponse = (await import("../models/Agentresponse.js")).default;
    } catch {
      // Fallback: try mongoose registered models
      AgentResponse = mongoose.models["AgentResponse"];
    }

    if (!AgentResponse) {
      return res.status(500).json({
        success: false,
        message: "AgentResponse model not found. Ensure it is registered.",
      });
    }

    const filter = {};
    if (status && status !== "all") filter.responseStatus = status;
    if (agentId) filter.agentId = new mongoose.Types.ObjectId(agentId);
    if (hasOrder === "true") filter.hasOrder = true;
    if (search) {
      filter.$or = [
        { placeName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { productDiscussed: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const [responses, total] = await Promise.all([
      AgentResponse.find(filter)
        .populate("agentId", "name phone email city")
        .sort({ [sortBy]: sortOrder })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      AgentResponse.countDocuments(filter),
    ]);

    // Stats
    const allResponses = await AgentResponse.find(filter).lean();
    const stats = {
      total: allResponses.length,
      positive: allResponses.filter((r) => r.responseStatus === "Responded - Positive").length,
      orders: allResponses.filter((r) => r.hasOrder).length,
      followUp: allResponses.filter((r) => r.nextAction && r.nextAction !== "None Required").length,
      noResponse: allResponses.filter((r) => r.responseStatus === "No Response").length,
      orderValue: allResponses
        .filter((r) => r.hasOrder && r.orderValue)
        .reduce((s, r) => s + Number(r.orderValue || 0), 0),
    };

    return res.json({ success: true, data: responses, total, stats });
  } catch (err) {
    console.error("[getAdminLeads]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  GET /api/points/admin/leads/:agentId 
export const getLeadsByAgent = async (req, res) => {
  try {
    let AgentResponse;
    try {
      AgentResponse = (await import("../models/Agentresponse.js")).default;
    } catch {
      AgentResponse = mongoose.models["AgentResponse"];
    }

    if (!AgentResponse) {
      return res.status(500).json({ success: false, message: "AgentResponse model not found" });
    }

    const responses = await AgentResponse.find({ agentId: req.params.agentId })
      .populate("agentId", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    // Points history for this agent
    const pointsHistory = await AgentPoints.find({ agentId: req.params.agentId })
      .sort({ createdAt: -1 })
      .lean();

    const balance = pointsHistory.reduce((s, h) => s + h.points, 0);

    return res.json({
      success: true,
      data: responses,
      pointsBalance: balance,
      pointsHistory,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/points/admin/slip/:payoutId
export const getSlipByPayout = async (req, res) => {
  try {
    const PayoutSlip = (await import("../models/payoutSlip.js")).default;
    const slip = await PayoutSlip.findOne({ payoutId: req.params.payoutId }).lean();
    if (!slip) return res.status(404).json({ success: false, message: "Slip not found" });
    return res.json({ success: true, data: slip });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/points/agent/slip/:payoutId  (agent fetches their own slip)
export const getAgentSlip = async (req, res) => {
  try {
    const PayoutSlip = (await import("../models/payoutSlip.js")).default;
    const slip = await PayoutSlip.findOne({
      payoutId: req.params.payoutId,
      agentId:  req.user.id,
      isVisible: true,
    }).lean();
    if (!slip) return res.status(404).json({ success: false, message: "Slip not available" });
    return res.json({ success: true, data: slip });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};