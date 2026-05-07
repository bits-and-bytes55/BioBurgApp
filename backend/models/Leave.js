import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    agentRef:  { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
    agentName: { type: String },
    leaveType: { type: String, enum: ["casual", "sick", "earned", "emergency"], default: "casual" },
    fromDate:  { type: Date, required: true },
    toDate:    { type: Date, required: true },
    reason:    { type: String, default: "" },
    status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Leave", leaveSchema);