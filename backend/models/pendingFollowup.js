import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String, 
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    stage: {
      type: String,
      enum: ["pending", "contacted", "in_progress", "completed", "overdue"],
      default: "pending",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    notes: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      default: null,
    },
  },
  { timestamps: true }
);

followUpSchema.index({ date: 1, stage: 1 });

export default mongoose.model("FollowUp", followUpSchema);