// models/DailyExpenses.js
import mongoose from "mongoose";

const expenseEntrySchema = new mongoose.Schema({
  category:    { type: String, required: true },
  amount:      { type: Number, required: true, min: 0 },
  description: { type: String },
  receiptUrl:  { type: String },          // uploaded receipt image URL
  hasReceipt:  { type: Boolean, default: false },
  billNumber:  { type: String },
  vendor:      { type: String },
}, { timestamps: true });

const dailyExpenseSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "MarketingAgent",
    required: true,
  },
  date:        { type: String, required: true },   // YYYY-MM-DD
  entries:     [expenseEntrySchema],
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["draft", "submitted", "approved", "rejected"],
    default: "draft",
  },
  submittedAt:   { type: Date },
  approvedBy:    { type: String },
  approvedAt:    { type: Date },
  rejectedReason:{ type: String },
  notes:         { type: String },
}, { timestamps: true });

dailyExpenseSchema.index({ agent: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyExpense", dailyExpenseSchema);