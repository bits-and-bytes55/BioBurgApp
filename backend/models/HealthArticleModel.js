import mongoose from "mongoose";

const healthArticleSchema = new mongoose.Schema(
  {
    // Form se 'Article Heading' aayega
    heading: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const HealthArticle = mongoose.model("HealthArticleModel", healthArticleSchema);
export default HealthArticle;