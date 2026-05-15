import PaymentIssue from "../models/paymentIssue.js";
import PayoutSlip   from "../models/payoutSlip.js";
import cloudinary   from "../config/cloudinary.js";

const getAgentId = req => req.user?.id || req.user?._id;

export const uploadSlipLogo = async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ success: false, message: "No image provided" });
    const result = await cloudinary.uploader.upload(base64, {
      folder: "slip_logos",
      resource_type: "image",
    });
    return res.json({ success: true, url: result.secure_url, public_id: result.public_id });
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
      const totalDeductions = (updateData.deductions || []).reduce((s, d) => s + Number(d.amount || 0), 0);
      updateData.netAmount = gross - totalDeductions;
    }

    const slip = await PayoutSlip.findOneAndUpdate(
      { payoutId },
      updateData,
      { new: true, upsert: false }
    );
    if (!slip) return res.status(404).json({ success: false, message: "Slip not found" });
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
      return res.status(400).json({ success: false, message: "Subject and description are required" });
    }
    const issue = await PaymentIssue.create({
      agentId, payoutId: payoutId || null, subject, description,
      timeline: [{ by: "agent", message: description }],
    });
    return res.status(201).json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAgentIssues = async (req, res) => {
  try {
    const issues = await PaymentIssue.find({ agentId: getAgentId(req) })
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
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: "Message required" });
    const issue = await PaymentIssue.findOne({ _id: req.params.id, agentId: getAgentId(req) });
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    issue.timeline.push({ by: "agent", message });
    await issue.save();
    return res.json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const agentConfirmResolved = async (req, res) => {
  try {
    const issue = await PaymentIssue.findOne({ _id: req.params.id, agentId: getAgentId(req) });
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    issue.agentConfirmedResolved = true;
    issue.status = "closed";
    issue.timeline.push({ by: "agent", message: "Agent confirmed issue is resolved." });
    await issue.save();
    return res.json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminGetAllIssues = async (req, res) => {
  try {
    const issues = await PaymentIssue.find()
      .populate("agentId",  "name phone email")
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
    if (!message?.trim()) return res.status(400).json({ success: false, message: "Message required" });
    const issue = await PaymentIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
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
    const issue = await PaymentIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    issue.status = status;
    if (message?.trim()) issue.timeline.push({ by: "admin", message });
    await issue.save();
    return res.json({ success: true, data: issue });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};