import mongoose from "mongoose";

const salaryTransactionSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      default: "credit",
    },
    
    source: {
      type: String,
      enum: ["expense_approval", "manual", "payout"],
      default: "expense_approval",
    },

    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyExpense",
    },

    expenseDate: String,

    note: String,
  },
  { timestamps: true }
);

export default mongoose.model("SalaryTransaction", salaryTransactionSchema);