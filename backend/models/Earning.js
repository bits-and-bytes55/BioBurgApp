import mongoose from "mongoose";

const earningSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",         
      required: true,
    },
    type: {
      type: String,
      enum: ["Commission", "Bonus", "Penalty", "Adjustment"],
      default: "Commission",
    },
    amount: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    note:   { type: String },
  },
  { timestamps: true }
);

/* Compound unique index — prevents duplicate commission for same order */
earningSchema.index({ agent: 1, order: 1, type: 1 }, { unique: true });

export default mongoose.model("Earning", earningSchema);