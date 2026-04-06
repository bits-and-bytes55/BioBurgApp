import mongoose from "mongoose";

const ConsultationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  question: String,
  replies: [{
    from: String, // 'doctor' or 'user'
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ["open","closed"], default: "open" }
}, { timestamps: true });

export default mongoose.model("Consultation", ConsultationSchema);
