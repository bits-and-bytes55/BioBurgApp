// models/paymentIssue.js
import mongoose from "mongoose";

const TimelineEntrySchema = new mongoose.Schema(
  {
    by:      { type: String, enum: ["agent", "admin"], required: true },
    message: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaymentIssueSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      required: true,
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutRequest",  
      default: null,
      index: true,           
    },
    subject:     { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,          
    },
    timeline: [TimelineEntrySchema],
    agentConfirmedResolved: { type: Boolean, default: false },
  },
  { timestamps: true }       
);

PaymentIssueSchema.index(
  { agentId: 1, payoutId: 1, status: 1 },
  { name: "agent_payout_status" }
);

export default mongoose.model("PaymentIssue", PaymentIssueSchema);