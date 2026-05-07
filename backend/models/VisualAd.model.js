// models/VisualAd.model.js
import mongoose from "mongoose";

const visualAdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    publicId: {
      // Cloudinary public_id for deletion
      type: String,
      required: true,
    },
    thumbnailUrl: {
      // For videos — optional static preview
      type: String,
      default: null,
    },
    thumbnailPublicId: {
      type: String,
      default: null,
    },
    targetType: {
      // "all" = show to every agent | "specific" = only listed agents
      type: String,
      enum: ["all", "specific"],
      default: "all",
    },
    targetAgents: [
      {
        // Array of MarketingAgent _id when targetType === "specific"
        type: mongoose.Schema.Types.ObjectId,
        ref: "MarketingAgent",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      // Admin reference (optional — store admin token sub if available)
      type: String,
      default: "admin",
    },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model("VisualAd", visualAdSchema);