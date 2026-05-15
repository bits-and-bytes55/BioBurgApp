import cloudinary from "../config/cloudinary.js";
import AgentReferral from "../models/agentReferral.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";


// CREATE REFERRAL
export const createReferral = async (req, res) => {
  try {
    const {
      resumeBase64,
      resumeFile,
      resumeFileName,
      ...rest
    } = req.body;

    let resumeUrl = "";
let resumePublicId = "";

if (resumeBase64) {
  const uploadRes = await cloudinary.uploader.upload(resumeBase64, {
    folder: "referral_resumes",
    resource_type: "raw",
    format: "pdf",
    public_id: `resume_${Date.now()}`,
  });

  resumeUrl = uploadRes.secure_url;
  resumePublicId = uploadRes.public_id;
}

    const referral = await AgentReferral.create({
      ...rest,
      resumeUrl,
      resumePublicId,
    });

    res.status(201).json({
      success: true,
      message: "Referral submitted successfully",
      referral,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET ALL REFERRALS
export const getAllReferrals = async (req, res) => {
  try {
    const referrals = await AgentReferral.find()
      .sort({ createdAt: -1 });

    res.status(200).json(referrals);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET SINGLE REFERRAL
export const getReferralById = async (req, res) => {
  try {
    const referral = await AgentReferral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    res.status(200).json(referral);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// APPROVE REFERRAL
export const approveReferral = async (req, res) => {
  try {
    const { designation } = req.body;

    const referral = await AgentReferral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    referral.status = "approved";
    referral.designation = designation || "";
    referral.approvedAt = new Date();

    await referral.save();

    res.status(200).json({
      success: true,
      message: "Referral approved successfully",
      referral,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// REJECT REFERRAL
export const rejectReferral = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const referral = await AgentReferral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    referral.status = "rejected";
    referral.rejectionReason = rejectionReason || "";
    referral.rejectedAt = new Date();

    await referral.save();

    res.status(200).json({
      success: true,
      message: "Referral rejected successfully",
      referral,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE REFERRAL
export const deleteReferral = async (req, res) => {
  try {
    const referral = await AgentReferral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    // Delete resume from cloudinary
    if (referral.resumePublicId) {
      await deleteFromCloudinary(
        referral.resumePublicId,
        "raw"
      );
    }

    // Delete DB record
    await referral.deleteOne();

    res.status(200).json({
      success: true,
      message: "Referral and resume deleted successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdminReferrals = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const total = await AgentReferral.countDocuments();

    const referrals = await AgentReferral.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      referrals,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};