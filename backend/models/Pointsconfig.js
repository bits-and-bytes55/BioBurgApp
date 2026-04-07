import mongoose from "mongoose";

const PointsConfigSchema = new mongoose.Schema(
  {
    taskKey: { type: String, required: true, unique: true },
    taskLabel: { type: String, required: true },
    points: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("PointsConfig", PointsConfigSchema);