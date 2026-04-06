import mongoose from "mongoose";

const bioburgJewelersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // optional but recommended
    },

    logo: {
      type: String,       // Cloudinary secure_url
      required: true,
    },

    logoPublicId: {
      type: String,       // Cloudinary public_id
      required: true,
    },

    redirectUrl: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BioburgJewelers", bioburgJewelersSchema);
