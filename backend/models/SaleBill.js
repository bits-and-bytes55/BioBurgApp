// models/SaleBill.js
import mongoose from "mongoose";

const saleBillSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },

  marketingAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarketingAgent",
    required: true
  },

  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
    required: true
  },

  billNo: String,
  billDate: { type: Date, default: Date.now },

  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      qty: Number,
      rate: Number,
      discount: Number,
      amount: Number
    }
  ],

  totalAmount: Number,
  taxAmount: { type: Number, default: 0 },
  invoiceValue: Number

}, { timestamps: true });

export default mongoose.model("SaleBill", saleBillSchema);
