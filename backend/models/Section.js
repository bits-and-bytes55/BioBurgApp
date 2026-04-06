// models/Section.js
import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    key: { type: String, unique: true },

    //NEW FIELD
    order: {
      type: Number,
      default: 0,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Section", SectionSchema);
