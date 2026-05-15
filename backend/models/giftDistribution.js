import mongoose from "mongoose";

const giftDistributionSchema = new mongoose.Schema(
  {
    gift:  { type: mongoose.Schema.Types.ObjectId, ref: "Gift",            required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent",  required: true },

    recipientName:    { type: String, required: true, trim: true },
    recipientType: {
  type: String,
  enum: [
    "Doctor", "Physician", "Chemist", "Pharmacist", "Stockist",
    "Hospital", "Clinic", "Nursing Home", "Manager", "Purchase Manager",
    "Receptionist", "Nurse", "Lab Technician", "Owner",
    "Administrator", "Other"
  ],
  required: true
},
    recipientContact: { type: String, default: "" },
    area:             { type: String, default: "" },

    proofImage:   { url: String, public_id: String },
    customerTier: { type: String, enum: ['A','B','C','D'] },

    quantity:  { type: Number, required: true, min: 1 },
    occasion:  { type: String, default: "" },
    notes:     { type: String, default: "" },
    distributedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("GiftDistribution", giftDistributionSchema);