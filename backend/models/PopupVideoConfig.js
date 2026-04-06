import mongoose from "mongoose";

const PopupVideoConfigSchema = new mongoose.Schema(
  {
    config: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("PopupVideoConfig", PopupVideoConfigSchema);