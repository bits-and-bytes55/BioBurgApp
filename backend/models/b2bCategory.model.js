import mongoose from "mongoose";

const b2bCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    image: {
      type: String, // Cloudinary image URL
      required: false,
    },

    imagePublicId: {
      type: String, // Cloudinary public_id
      required: false,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    redirectUrl: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("B2BCategory", b2bCategorySchema);
