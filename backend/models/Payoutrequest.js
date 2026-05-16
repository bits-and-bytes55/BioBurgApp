import mongoose from "mongoose";

const PayoutRequestSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      required: true,
    },
    agentName: { type: String, default: "" },
    agentPhone: { type: String, default: "" },
    pointsRedeemed: { type: Number, required: true },
    salaryAmount: { type: Number, default: 0 },
    amountRequested: { type: Number, required: true },
    bankDetails: {
      accountHolder: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    adminNote: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

PayoutRequestSchema.index({ agentId: 1, status: 1 });

export default mongoose.models.PayoutRequest ||
  mongoose.model("PayoutRequest", PayoutRequestSchema);