// controllers/bankDetailsController.js
import AgentBankDetails from "../models/agentBankDetails.js";
import cloudinary from "../config/cloudinary.js";

const getAgentId = req => req.user?.id || req.user?._id;

// Upload base64 to Cloudinary 
const uploadBase64 = (base64String, folder) =>
  cloudinary.uploader.upload(base64String, {
    folder,
    resource_type: "auto",
  });

// GET bank details 
export const getBankDetails = async (req, res) => {
  try {
    const doc = await AgentBankDetails.findOne({ agentId: getAgentId(req) }).lean();
    return res.json({ success: true, data: doc || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const saveBankDetails = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const existing = await AgentBankDetails.findOne({ agentId });

    if (existing?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Bank details are locked. Submit a correction request to update.",
      });
    }

    const { accountHolder, accountNumber, ifsc, bankName, upiId } = req.body;

    if (!accountNumber && !upiId) {
      return res.status(400).json({
        success: false,
        message: "Provide bank account number or UPI ID",
      });
    }

    const doc = await AgentBankDetails.findOneAndUpdate(
      { agentId },
      {
        agentId,
        accountHolder: accountHolder || "",
        accountNumber: accountNumber || "",
        ifsc:          (ifsc || "").toUpperCase(),
        bankName:      bankName || "",
        upiId:         upiId || "",
        isLocked:      true,
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const submitCorrectionRequest = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const existing = await AgentBankDetails.findOne({ agentId });

    if (!existing) {
      return res.status(404).json({ success: false, message: "No bank details found" });
    }
    if (existing.correctionStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "You already have a pending correction request",
      });
    }

    const { reason, documents } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const uploaded = [];
    for (const doc of documents || []) {
      if (!doc.base64) continue;
      const result = await uploadBase64(doc.base64, "agent_bank_corrections");
      uploaded.push({
        url:       result.secure_url,
        public_id: result.public_id,
        label:     doc.label || "Document",
      });
    }

    existing.correctionStatus = "pending";
    existing.correctionRequest = {
      reason,
      documents:   uploaded,
      submittedAt: new Date(),
      adminNote:   "",
      resolvedAt:  null,
    };
    await existing.save();

    return res.json({ success: true, message: "Correction request submitted successfully" });
  } catch (err) {
    console.error("[submitCorrectionRequest]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminGetCorrectionRequests = async (req, res) => {
  try {
    const docs = await AgentBankDetails.find({ correctionStatus: "pending" })
      .populate("agentId", "name phone email")
      .lean();
    return res.json({ success: true, data: docs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminResolveCorrectionRequest = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { action, adminNote } = req.body; 

    const doc = await AgentBankDetails.findOne({ agentId });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    doc.correctionStatus = action === "approve" ? "approved" : "rejected";
    doc.correctionRequest.adminNote  = adminNote || "";
    doc.correctionRequest.resolvedAt = new Date();

    if (action === "approve") {
      doc.isLocked = false; 
    }

    await doc.save();
    return res.json({ success: true, message: `Correction ${doc.correctionStatus}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};