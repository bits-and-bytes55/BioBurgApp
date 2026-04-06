import mongoose from "mongoose";

const PartnerUserSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
  },
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    default: "PARTNER",
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

export default mongoose.model("PartnerUser", PartnerUserSchema);
