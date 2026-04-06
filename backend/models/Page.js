import mongoose from "mongoose";

const homeContentSchema = new mongoose.Schema(
  {
    section: { type: String, required: true }, 
    title: String,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("HomeContent", homeContentSchema);

