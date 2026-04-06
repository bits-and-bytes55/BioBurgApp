import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
    },
    userId: {                             
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportFile: {
      url: String,
      public_id: String,
    },
    status: {
      type: String,
      enum: ["UPLOADED"],
      default: "UPLOADED",
    },
    uploadedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);