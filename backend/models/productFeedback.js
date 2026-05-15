import mongoose from "mongoose";

const productFeedbackSchema = new mongoose.Schema(
  {
    customer: {
      name: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        default: "",
      },

      role: {
        type: String,
        default: "",
      },

      area: {
        type: String,
        default: "",
      },

      placeName: {
        type: String,
        default: "",
      },

      isExisting: {
        type: Boolean,
        default: false,
      },
    },

    products: [
      {
        productId: {
          type: String,
          default: "",
        },

        productName: {
          type: String,
          default: "",
        },

        brandName: {
          type: String,
          default: "",
        },

        rating: {
          type: String,
          enum: [
            "Satisfactory",
            "Good",
            "Better",
            "Best",
            "Other",
          ],
        },

        comment: {
          type: String,
          default: "",
        },
      },
    ],

    overallRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
  },
  { timestamps: true }
);

const ProductFeedback = mongoose.model(
  "ProductFeedback",
  productFeedbackSchema
);

export default ProductFeedback;