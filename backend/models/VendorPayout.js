// models/VendorPayout.js
import mongoose from "mongoose";

const vendorPayoutSchema = new mongoose.Schema(
  {
    vendor:          { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    amount:          { type: Number, required: true },
    status:          { type: String, enum: ["pending", "processing", "paid", "failed"], default: "pending" },
    ordersIncluded:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    transactionId:   { type: String, default: "" },
    notes:           { type: String, default: "" },
    paidAt:          { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("VendorPayout", vendorPayoutSchema);