import mongoose from "mongoose";

const requirementHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "QUOTED",
        "REVISION_REQUESTED",
        "APPROVED",
        "REJECTED",
        "CLOSED",
      ],
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    actor: {
      type: String,
      default: "System",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const bulkManufacturingRequirementSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkManufacturingAccount",
      required: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkManufacturingRequest",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    dosageForm: {
      type: String,
      default: "",
      trim: true,
    },
    packaging: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: String,
      required: true,
      trim: true,
    },
    targetCountry: {
      type: String,
      default: "",
      trim: true,
    },
    targetTimeline: {
      type: String,
      default: "",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "QUOTED",
        "REVISION_REQUESTED",
        "APPROVED",
        "REJECTED",
        "CLOSED",
      ],
      default: "SUBMITTED",
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    quote: {
      currency: {
        type: String,
        default: "USD",
      },
      unitPrice: {
        type: Number,
        default: 0,
      },
      moq: {
        type: String,
        default: "",
        trim: true,
      },
      leadTimeDays: {
        type: Number,
        default: 0,
      },
      quoteNotes: {
        type: String,
        default: "",
        trim: true,
      },
      quoteDocumentUrl: {
        type: String,
        default: "",
        trim: true,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    statusHistory: {
      type: [requirementHistorySchema],
      default: [
        {
          status: "SUBMITTED",
          note: "Requirement submitted",
          actor: "Partner",
        },
      ],
    },
  },
  { timestamps: true },
);

export default mongoose.model(
  "BulkManufacturingRequirement",
  bulkManufacturingRequirementSchema,
);
