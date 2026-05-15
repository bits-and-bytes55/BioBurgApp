import mongoose from "mongoose";

const agentReferralSchema = new mongoose.Schema(
  {
    // Personal
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    dob: {
      type: String,
      required: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    motherName: {
      type: String,
      default: "",
      trim: true,
    },

    currentAddress: {
      type: String,
      required: true,
    },

    permanentAddress: {
      type: String,
      default: "",
    },

    // Education
    highestQualification: {
      type: String,
      required: true,
    },

    qualificationOther: {
      type: String,
      default: "",
    },

    stream: {
      type: String,
      default: "",
    },

    streamOther: {
      type: String,
      default: "",
    },

    institution: {
      type: String,
      required: true,
    },

    passingYear: {
      type: String,
      required: true,
    },

    percentage: {
      type: String,
      required: true,
    },

    additionalCourses: {
      type: String,
      default: "",
    },

    // Contact
    phone: {
      type: String,
      required: true,
    },

    whatsapp: {
      type: String,
      required: true,
    },

    alternatePhone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    linkedin: {
      type: String,
      default: "",
    },

    // Referral
    relationWithCandidate: {
      type: String,
      required: true,
    },

    relationOther: {
      type: String,
      default: "",
    },

    referralNote: {
      type: String,
      default: "",
    },

    // Resume
    resumeUrl: {
      type: String,
      default: "",
    },

    resumePublicId: {
      type: String,
      default: "",
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    designation: {
      type: String,
      default: "",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    approvedAt: Date,
    rejectedAt: Date,
  },
  {
    timestamps: true,
  }
);

const AgentReferral = mongoose.model(
  "AgentReferral",
  agentReferralSchema
);

export default AgentReferral;