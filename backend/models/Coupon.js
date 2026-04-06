import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  discountPercent: Number,
  maxDiscount: Number,
  expiresAt: Date,
  active: { type: Boolean, default: true }
});

export default mongoose.model("Coupon", CouponSchema);
