import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    videoUrl:            { type: String, required: [true, "Video URL is required"], trim: true },
    videoPublicId:       { type: String, default: "" },
    clientImage:         { type: String, required: [true, "Client image is required"], trim: true },
    clientImagePublicId: { type: String, default: "" },
    description:         { type: String, default: "", trim: true },
    clientName:          { type: String, default: "", trim: true },
    position:            { type: String, default: "", trim: true },
    birthDate:           { type: String, default: "" },
    brandName:           { type: String, default: "", trim: true },
    brandId:             { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);
export default Testimonial;