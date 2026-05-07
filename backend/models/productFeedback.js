import mongoose from "mongoose";

const productFeedbackSchema = new mongoose.Schema(
  {
    submitter_type: {
      type: String,
      required: true,
      trim: true,
    },

    submitter_name: {
      type: String,
      required: true,
      trim: true,
    },

    submitter_phone: {
      type: String,
      required: true,
      trim: true,
    },

    submitter_email: {
      type: String,
      default: null,
      trim: true,
    },

    organization_name: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    product_name: {
      type: String,
      required: true,
      trim: true,
    },

    product_code: {
      type: String,
      default: null,
      trim: true,
    },

    batch_number: {
      type: String,
      default: null,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    product_source: {
      type: String,
      required: true,
      trim: true,
    },

    how_long: {
      type: String,
      required: true,
      trim: true,
    },

    feedback_type: {
      type: String,
      required: true,
      trim: true,
    },

    patient_age_group: {
      type: String,
      required: true,
      trim: true,
    },

    prescription_count: {
      type: Number,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    overall_experience: {
      type: String,
      required: true,
      trim: true,
    },

    feedback_text: {
      type: String,
      required: true,
      trim: true,
    },

    specific_issue: {
      type: String,
      default: null,
      trim: true,
    },

    suggestions: {
      type: String,
      default: null,
      trim: true,
    },

    would_recommend: {
      type: String,
      required: true,
      trim: true,
    },

    submitted_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ProductFeedback = mongoose.model(
  "ProductFeedback",
  productFeedbackSchema
);

export default ProductFeedback;