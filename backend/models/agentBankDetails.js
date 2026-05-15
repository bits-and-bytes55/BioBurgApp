import mongoose from "mongoose";

const CorrectionDocSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  public_id: { type: String },
  label:     { type: String },
}, { _id: false });

const AgentBankDetailsSchema = new mongoose.Schema(
  {
    agentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "MarketingAgent",
      required: true,
      unique:   true,
    },
    accountHolder: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifsc:          { type: String, default: "" },
    bankName:      { type: String, default: "" },
    upiId:         { type: String, default: "" },
    isLocked:      { type: Boolean, default: false },

    correctionStatus: {
      type:    String,
      enum:    ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    correctionRequest: {
      reason:      { type: String, default: "" },
      documents:   [CorrectionDocSchema],
      submittedAt: { type: Date },
      adminNote:   { type: String, default: "" },
      resolvedAt:  { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model("AgentBankDetails", AgentBankDetailsSchema);