import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientMobile: String,

    date: String,        // "2026-02-03"
    time: String,        // "10:30"

    mode: {
      type: String,
      enum: ["Video", "Audio", "Chat"],
      default: "Video",
    },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("DoctorConsultation", consultationSchema);
