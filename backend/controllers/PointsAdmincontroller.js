// controllers/pointsAdminController.js
import mongoose from "mongoose";
import AgentPoints from "../models/Agentpoints.js";
import PointsConfig from "../models/Pointsconfig.js";
import PayoutRequest from "../models/Payoutrequest.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const getViewerAgentId = (req) => req.user?.id || req.user?._id || req.agent?.id;

const getVisibleAgentIds = async (agentId) => {
  if (!agentId) return [];

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

// GET /api/points/admin/config
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
      return res.status(400).json({
        success: false,
        message: "taskKey, taskLabel, and points are required",
      });
    }

    const config = await PointsConfig.findOneAndUpdate(
      { taskKey },
      {
        taskKey,
        taskLabel,
        points: Number(points),
        description,
        isActive: isActive ?? true,
      },
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

// GET /api/points/admin/payouts
export const getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = status && status !== "all" ? { status } : {};

    const pageNo = Number(page);
    const limitNo = Number(limit);

    const [payouts, total] = await Promise.all([
      PayoutRequest.find(filter)
        .populate("agentId", "name phone email assignedArea role")
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * limitNo)
        .limit(limitNo)
        .lean(),
      PayoutRequest.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: payouts,
      total,
      page: pageNo,
      pages: Math.ceil(total / limitNo),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/points/admin/payouts/:id
export const updatePayoutStatus = async (req, res) => {
  try {
    const {
      status,
      adminNote,
      transactionId,
      companyName,
      companyLogo,
      companyAddress,
      companyPhone,
      companyEmail,
      companyGST,
      companyWebsite,
      slipTitle,
      slipNote,
      adminSignature,
      designation,
      paymentMode,
    } = req.body;

    const payout = await PayoutRequest.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout request not found",
      });
    }

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

    if (status === "rejected" && payout.pointsRedeemed > 0) {
      await AgentPoints.create({
        agentId: payout.agentId,
        taskKey: "payout_refund",
        taskLabel: "Payout Rejected - Refund",
        points: payout.pointsRedeemed,
        referenceId: payout._id.toString(),
        referenceModel: "PayoutRequest",
        note: adminNote
          ? `Payout rejected: ${adminNote}`
          : `Payout #${payout._id} rejected - points refunded`,
        addedBy: "admin",
      });
    }

    payout.status = status;
    if (adminNote) payout.adminNote = adminNote;
    if (transactionId) payout.transactionId = transactionId;
    payout.processedAt = new Date();

    if (!payout.agentName && payout.agentId) {
      const agent = await MarketingAgent.findById(payout.agentId)
        .select("name phone")
        .lean();

      if (agent) {
        payout.agentName = agent.name;
        payout.agentPhone = agent.phone;
      }
    }

    await payout.save();

    if (status === "paid") {
      const PayoutSlip = (await import("../models/payoutSlip.js")).default;
      const deductions = req.body.deductions || [];
      const totalDeductions = deductions.reduce(
        (s, d) => s + Number(d.amount || 0),
        0
      );
      const netAmount = payout.amountRequested - totalDeductions;

      await PayoutSlip.findOneAndUpdate(
        { payoutId: payout._id },
        {
          payoutId: payout._id,
          agentId: payout.agentId,
          agentName: payout.agentName || "",
          agentPhone: payout.agentPhone || "",
          amount: payout.amountRequested,
          deductions,
          netAmount,
          pointsRedeemed: payout.pointsRedeemed || 0,
          salaryAmount: payout.salaryAmount || 0,
          transactionId: transactionId || "",
          paidOn: new Date(),
          paymentMode: paymentMode || "Bank Transfer",
          companyName: companyName || "BioBurg Lifesciences Pvt. Ltd.",
          companyLogo: companyLogo || "",
          companyAddress: companyAddress || "",
          companyPhone: companyPhone || "",
          companyEmail: companyEmail || "",
          companyGST: companyGST || "",
          companyWebsite: companyWebsite || "",
          slipTitle: slipTitle || "Payment Receipt",
          slipNote: slipNote || "",
          adminSignature: adminSignature || "",
          designation: designation || "Authorized Signatory",
          isVisible: true,
          lastEditedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    return res.json({ success: true, data: payout });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/points/admin/award
export const manuallyAwardPoints = async (req, res) => {
  try {
    const { agentId, taskKey, points, note } = req.body;

    if (!agentId || !taskKey || !points) {
      return res.status(400).json({
        success: false,
        message: "agentId, taskKey, and points are required",
      });
    }

    const config = await PointsConfig.findOne({ taskKey }).lean();

    const entry = await AgentPoints.create({
      agentId,
      taskKey,
      taskLabel: config?.taskLabel || taskKey,
      points: Number(points),
      note: note || "Manually awarded by admin",
      addedBy: "admin",
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/points/admin/agents
export const getAgentPointsSummaries = async (req, res) => {
  try {
    const agents = await MarketingAgent.find({ isApproved: true })
      .select("_id name phone email assignedArea role")
      .lean();

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

    const pointsMap = {};
    pointsSummaries.forEach((s) => {
      pointsMap[s._id.toString()] = s;
    });

    const result = agents.map((agent) => {
      const pts = pointsMap[agent._id.toString()];

      return {
        agentId: agent._id,
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        assignedArea: agent.assignedArea,
        role: agent.role,
        totalPoints: pts?.totalPoints ?? 0,
        totalEarned: pts?.totalEarned ?? 0,
        totalRedeemed: pts?.totalRedeemed ?? 0,
        lastActivity: pts?.lastActivity ?? null,
      };
    });

    result.sort((a, b) => b.totalPoints - a.totalPoints);

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/points/admin/leads
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
      AgentResponse = mongoose.models.AgentResponse;
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

    const pageNo = Number(page);
    const limitNo = Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [responses, total, allResponses] = await Promise.all([
      AgentResponse.find(filter)
        .populate("agentId", "name phone email city assignedArea role")
        .sort({ [sortBy]: sortOrder })
        .skip((pageNo - 1) * limitNo)
        .limit(limitNo)
        .lean(),
      AgentResponse.countDocuments(filter),
      AgentResponse.find(filter).lean(),
    ]);

    const stats = {
      total: allResponses.length,
      positive: allResponses.filter(
        (r) => r.responseStatus === "Responded - Positive"
      ).length,
      orders: allResponses.filter((r) => r.hasOrder).length,
      followUp: allResponses.filter(
        (r) => r.nextAction && r.nextAction !== "None Required"
      ).length,
      noResponse: allResponses.filter((r) => r.responseStatus === "No Response")
        .length,
      orderValue: allResponses
        .filter((r) => r.hasOrder && r.orderValue)
        .reduce((s, r) => s + Number(r.orderValue || 0), 0),
    };

    return res.json({
      success: true,
      data: responses,
      total,
      page: pageNo,
      pages: Math.ceil(total / limitNo),
      stats,
    });
  } catch (err) {
    console.error("[getAdminLeads]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/points/admin/leads/:agentId
export const getLeadsByAgent = async (req, res) => {
  try {
    let AgentResponse;

    try {
      AgentResponse = (await import("../models/Agentresponse.js")).default;
    } catch {
      AgentResponse = mongoose.models.AgentResponse;
    }

    if (!AgentResponse) {
      return res.status(500).json({
        success: false,
        message: "AgentResponse model not found",
      });
    }

    const agentId = new mongoose.Types.ObjectId(req.params.agentId);

    const [responses, pointsHistory] = await Promise.all([
      AgentResponse.find({ agentId })
        .populate("agentId", "name phone email assignedArea role")
        .sort({ createdAt: -1 })
        .lean(),
      AgentPoints.find({ agentId }).sort({ createdAt: -1 }).lean(),
    ]);

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
    const slip = await PayoutSlip.findOne({
      payoutId: req.params.payoutId,
    }).lean();

    if (!slip) {
      return res.status(404).json({
        success: false,
        message: "Slip not found",
      });
    }

    return res.json({ success: true, data: slip });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/points/agent/slip/:payoutId
export const getAgentSlip = async (req, res) => {
  try {
    const viewerAgentId = getViewerAgentId(req);
    const visibleAgentIds = await getVisibleAgentIds(viewerAgentId);

    const PayoutSlip = (await import("../models/payoutSlip.js")).default;

    const slip = await PayoutSlip.findOne({
      payoutId: req.params.payoutId,
      agentId: {
        $in: visibleAgentIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
      isVisible: true,
    }).lean();

    if (!slip) {
      return res.status(404).json({
        success: false,
        message: "Slip not available",
      });
    }

    return res.json({ success: true, data: slip });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
