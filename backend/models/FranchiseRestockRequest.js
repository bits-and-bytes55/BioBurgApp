import mongoose from "mongoose";

const FranchiseRestockRequestSchema = new mongoose.Schema(
  {
    franchiseAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchiseAccount",
      required: true,
      index: true,
    },
    franchiseApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      default: null,
      index: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      default: "",
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    requestedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "IN_PROGRESS",
        "FULFILLED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },
    requestNote: {
      type: String,
      default: "",
    },
    adminNote: {
      type: String,
      default: "",
    },
    requestedBy: {
      type: String,
      default: "franchise",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model(
  "FranchiseRestockRequest",
  FranchiseRestockRequestSchema,
);
