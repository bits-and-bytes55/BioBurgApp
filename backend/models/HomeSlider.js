import mongoose from "mongoose";

const homeSliderSchema = new mongoose.Schema(
  {
    image: String,
    public_id: String,
    title: String,
    desc: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomeSlider", homeSliderSchema);
