import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    offer: {
      type: Number,
      default: 0,
    },

    slug: {
      type: String,
      trim: true,
    },

    //PHASE 1: ObjectId reference (dual mode)
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);
