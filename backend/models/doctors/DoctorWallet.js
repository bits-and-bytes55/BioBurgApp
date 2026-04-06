import mongoose from "mongoose";

const doctorWalletSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },

  totalEarnings: {
    type: Number,
    default: 0,
  },

  availableBalance: {
    type: Number,
    default: 0,
  },

  transactions: [
    {
      amount: Number,
      type: {
        type: String,
        enum: ["credit", "debit"],
      },
      date: {
        type: Date,
        default: Date.now,
      },
      description: String,
    },
  ],
}, { timestamps: true });

export default mongoose.model("DoctorWallet", doctorWalletSchema);