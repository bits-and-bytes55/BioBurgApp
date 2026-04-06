import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    route: { type: String, required: true },
    content: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Policy = mongoose.model("Policy", policySchema);

export default Policy;