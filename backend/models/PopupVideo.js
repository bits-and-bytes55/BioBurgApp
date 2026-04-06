import mongoose from "mongoose";

const PopupVideoSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  showOnce: { type: Boolean, default: true }, 
  delaySeconds: { type: Number, default: 3 },  
  buttonText: { type: String, default: "Learn More" },
  buttonLink: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("PopupVideo", PopupVideoSchema);