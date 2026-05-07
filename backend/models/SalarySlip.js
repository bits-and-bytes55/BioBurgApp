import mongoose from "mongoose";

const salarySlipSchema = new mongoose.Schema(
  {
    agentRef:    { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
    agentName:   { type: String, default: "" },
    month:       { type: String, required: true },  
    year:        { type: Number, required: true }, 
    basicPay:    { type: Number, default: 0 },
    allowances:  { type: Number, default: 0 },
    deductions:  { type: Number, default: 0 },
    netPay:      { type: Number, default: 0 },
    fileUrl:     { type: String, default: "" },     
    generatedAt: { type: Date,   default: Date.now },
    remarks:     { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("SalarySlip", salarySlipSchema);