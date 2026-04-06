import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    sectionKey: { type: String, required: true }, // hero, about, services
    heading: String,
    content: String,
    image: String, // image URL
    order: Number,
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    sections: [sectionSchema],
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cmsPageSchema = new mongoose.Schema(
  {
    pageSlug: { type: String, unique: true }, // home, about
    pageName: String,

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    sections: [sectionSchema],

    seo: {
      metaTitle: String,
      metaDescription: String,
    },

    versions: [versionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("CMSPage", cmsPageSchema);
