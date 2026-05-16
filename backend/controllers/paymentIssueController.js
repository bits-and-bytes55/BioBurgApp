import mongoose from "mongoose";
import PaymentIssue from "../models/paymentIssue.js";
import PayoutSlip from "../models/payoutSlip.js";
import PayoutRequest from "../models/PayoutRequest.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import cloudinary from "../config/cloudinary.js";

const getAgentId = (req) => req.user?.id || req.user?._id || req.agent?.id;

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

export const uploadSlipLogo = async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const result = await cloudinary.uploader.upload(base64, {
      folder: "slip_logos",
      resource_type: "image",
    });

    return res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePayoutSlip = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const updateData = { ...req.body, lastEditedAt: new Date() };

    if (updateData.deductions !== undefined) {
      const gross = updateData.amount || 0;
      const totalDeductions = (updateData.deductions || []).reduce(
        (s, d) => s + Number(d.amount || 0),
        0
      );
      updateData.netAmount = gross - totalDeductions;
    }

    const slip = await PayoutSlip.findOneAndUpdate({ payoutId }, updateData, {
      new: true,
      upsert: false,
    });

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

export const createPaymentIssue = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const { payoutId, subject, description } = req.body;

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    if (payoutId) {
      const payout = await PayoutRequest.findOne({
        _id: payoutId,
        agentId,
      }).lean();

      if (!payout) {
        return res.status(404).json({
          success: false,
          message: "Payout not found",
        });
      }

      const existing = await PaymentIssue.findOne({
        agentId,
        payoutId,
        status: { $in: ["open", "in_progress"] },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "You already have an open issue for this payout",
        });
      }
    }

    const issue = await PaymentIssue.create({
      agentId,
      payoutId: payoutId || null,
      subject,
      description,
      timeline: [{ by: "agent", message: description }],
    });

    return res.status(201).json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAgentIssues = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const filter = {
      agentId: { $in: visibleAgentIds },
    };

    if (req.query.payoutId) {
      filter.payoutId = req.query.payoutId;
    }

    if (req.query.agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(req.query.agentId);
      const canView = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You cannot view this agent issues",
        });
      }

      filter.agentId = requestedAgentId;
    }

    const issues = await PaymentIssue.find(filter)
      .populate("agentId", "name phone email assignedArea role")
      .populate("payoutId", "amountRequested createdAt status")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ success: true, data: issues });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const replyToIssue = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message required",
      });
    }

    const issue = await PaymentIssue.findOne({
      _id: req.params.id,
      agentId: { $in: visibleAgentIds },
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    if (issue.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot reply to a closed issue",
      });
    }

    const by =
      issue.agentId.toString() === viewerAgentId.toString()
        ? "agent"
        : "manager";

    issue.timeline.push({ by, message });
    await issue.save();

    return res.json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const agentConfirmResolved = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);

    const issue = await PaymentIssue.findOne({
      _id: req.params.id,
      agentId: viewerAgentId,
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    if (issue.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "Issue is not in resolved state yet",
      });
    }

    if (issue.agentConfirmedResolved) {
      return res.status(400).json({
        success: false,
        message: "Already confirmed",
      });
    }

    issue.agentConfirmedResolved = true;
    issue.status = "closed";
    issue.timeline.push({
      by: "agent",
      message: "Agent confirmed issue is resolved.",
    });

    await issue.save();

    return res.json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminGetAllIssues = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const issues = await PaymentIssue.find(filter)
      .populate("agentId", "name phone email assignedArea role")
      .populate("payoutId", "amountRequested createdAt status")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ success: true, data: issues });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminReplyToIssue = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message required",
      });
    }

    const issue = await PaymentIssue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    if (issue.status === "open") {
      issue.status = "in_progress";
    }

    issue.timeline.push({ by: "admin", message });
    await issue.save();

    return res.json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminUpdateIssueStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const VALID = ["open", "in_progress", "resolved", "closed"];

    if (!status || !VALID.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const issue = await PaymentIssue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    issue.status = status;

    if (message?.trim()) {
      issue.timeline.push({ by: "admin", message });
    }

    await issue.save();

    return res.json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
