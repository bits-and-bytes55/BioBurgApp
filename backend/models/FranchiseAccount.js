import mongoose from "mongoose";

const FranchiseAccountSchema = new mongoose.Schema({
  franchiseApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Franchise"
  },
  email: { type: String, unique: true },
  password: String,
  resetPasswordOtp: String,
  resetPasswordExpire: Date,
  role: { type: String, default: "FRANCHISE" },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone" },
  settlementConfig: {
    commissionRate: { type: Number, default: 12, min: 0, max: 100 },
    settlementHoldDays: { type: Number, default: 7, min: 0, max: 90 },
    minimumPayoutAmount: { type: Number, default: 0, min: 0 },
    settlementNotes: { type: String, default: "" },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  status: { type: String, default: "ACTIVE" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("FranchiseAccount", FranchiseAccountSchema);
