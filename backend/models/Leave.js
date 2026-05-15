import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      required: true,
    },

    // Employee Info
    name: String,
    enrollId: String,
    designation: String,
    workingAddress: String,
    level: String,
    ppaNo: String,
    aadharNo: String,
    panNo: String,

    employmentType: {
      type: String,
      default: "Permanent",
    },

    dateJoining: Date,

    // Leave Info
    leaveType: {
      type: String,
      enum: ["EL", "CL", "SL", "ML", "MAL", "PL", "CO", "LWP"],
      default: "CL",
    },

    halfDay: {
      type: Boolean,
      default: false,
    },

    halfDaySession: {
      type: String,
      enum: ["Forenoon", "Afternoon"],
      default: "Forenoon",
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    totalDays: {
      type: Number,
      default: 1,
    },

    prefixDate: Date,
    suffixDate: Date,

    // Address During Leave
    leaveAddress: String,

    leaveAddressType: {
      type: String,
      enum: ["In-Station", "Out-Station"],
      default: "In-Station",
    },

    leaveAddressContact: String,

    // Reason
    reason: {
      type: String,
      required: true,
    },

    othersInfo: String,
    remarks: String,

    // Base64 Documents
    medicalCertificate: {
      type: String,
      default: "",
    },

    supportDocument: {
      type: String,
      default: "",
    },

    // Admin
    adminRemark: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    approvedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Leave", leaveSchema);