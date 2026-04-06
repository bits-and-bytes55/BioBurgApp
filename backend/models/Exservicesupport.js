import mongoose from "mongoose";

const ExServiceSupportSchema = new mongoose.Schema(
  {
    // Submitted by veteran / applicant
    name:     { type: String, required: true },
    email:    { type: String, required: true },
    phone:    { type: String },
    category: { type: String, required: true },
    subject:  { type: String, required: true },
    message:  { type: String, required: true },

    // Context
    source:   { type: String, default: "ExService Careers Page" },
    zone:     { type: String, default: "Jobs & ExService" },

    // Admin fields
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    adminNote:   { type: String },
    resolvedAt:  { type: Date },
    assignedTo:  { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ExServiceSupport", ExServiceSupportSchema);