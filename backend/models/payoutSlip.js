import mongoose from "mongoose";

const DeductionSchema = new mongoose.Schema({
  category: { type: String, required: true }, 
  amount:   { type: Number, required: true },
  note:     { type: String, default: "" },
}, { _id: false });

const PayoutSlipSchema = new mongoose.Schema({
  payoutId:       { type: mongoose.Schema.Types.ObjectId, ref: "PayoutRequest", required: true, unique: true },
  agentId:        { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
  agentName:      { type: String, default: "" },
  agentPhone:     { type: String, default: "" },
  amount:         { type: Number, required: true },  
  deductions:     [DeductionSchema],                 
  netAmount:      { type: Number, default: 0 },       
  pointsRedeemed: { type: Number, default: 0 },
  salaryAmount:   { type: Number, default: 0 },
  transactionId:  { type: String, default: "" },
  paidOn:         { type: Date },
  paymentMode:    { type: String, default: "Bank Transfer" },
  companyName:    { type: String, default: "" },
  companyLogo:    { type: String, default: "" },  
  companyAddress: { type: String, default: "" },
  companyPhone:   { type: String, default: "" },
  companyEmail:   { type: String, default: "" },
  companyGST:     { type: String, default: "" },
  companyWebsite: { type: String, default: "" },
  slipTitle:      { type: String, default: "Payment Receipt" },
  slipNote:       { type: String, default: "" },
  adminSignature: { type: String, default: "" },
  designation:    { type: String, default: "" },
  isVisible:      { type: Boolean, default: true },
  lastEditedAt:   { type: Date },   
}, { timestamps: true });

export default mongoose.model("PayoutSlip", PayoutSlipSchema);