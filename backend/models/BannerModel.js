import mongoose from "mongoose";

// Model update kar diya hai, ab isme sirf imageUrl hai
const adBannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const AdBanner = mongoose.model("BannerModel", adBannerSchema);
export default AdBanner;