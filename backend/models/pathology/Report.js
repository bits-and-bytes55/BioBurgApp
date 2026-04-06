import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    userId: {                              
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportUrl: {
      type: String,
      required: true,
    },
    reportPublicId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reports", reportSchema);