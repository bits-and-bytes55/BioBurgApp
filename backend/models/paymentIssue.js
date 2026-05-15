import mongoose from "mongoose";

const TimelineEntrySchema = new mongoose.Schema({
  by:        { type: String, enum: ["agent", "admin"], required: true },
  message:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const PaymentIssueSchema = new mongoose.Schema({
  agentId:   { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
  payoutId:  { type: mongoose.Schema.Types.ObjectId, ref: "PayoutRequest" },
  subject:   { type: String, required: true },
  description:{ type: String, required: true },
  status:    { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  timeline:  [TimelineEntrySchema],
  agentConfirmedResolved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("PaymentIssue", PaymentIssueSchema);