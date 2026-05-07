import mongoose from "mongoose";

const bioburgPaymentSchema = new mongoose.Schema({
  agentId:      { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
  agentName:    { type: String, default: "" },

  // Payment identity
  paymentRef:   { type: String, unique: true },   // BB-PAY-25-00001
  paymentType:  {
    type: String,
    enum: ["salary", "incentive", "reimbursement", "advance", "commission", "bonus", "other"],
    default: "other",
  },

  // Amount
  amount:       { type: Number, required: true, min: 0 },
  mode:         { type: String, enum: ["cash", "neft", "imps", "upi", "cheque", "other"], default: "neft" },

  // Period (for salary / incentive)
  forMonth:     { type: Number },   // 1–12
  forYear:      { type: Number },

  // Status
  status:       { type: String, enum: ["pending", "processed", "paid", "failed"], default: "pending" },
  paidOn:       { type: Date },

  // Bank / txn
  bankName:     { type: String, default: "" },
  accountLast4: { type: String, default: "" },
  txnRef:       { type: String, default: "" },
  chequeNo:     { type: String, default: "" },

  remarks:      { type: String, default: "" },

  // Admin who created
  createdByAdmin: { type: String, default: "admin" },
}, { timestamps: true });

bioburgPaymentSchema.pre("save", async function (next) {
  if (!this.paymentRef) {
    const count = await mongoose.model("BioburgPayment").countDocuments();
    const pad   = String(count + 1).padStart(5, "0");
    const year  = new Date().getFullYear().toString().slice(-2);
    this.paymentRef = `BB-PAY-${year}-${pad}`;
  }
  next();
});

export default mongoose.model("BioburgPayment", bioburgPaymentSchema);