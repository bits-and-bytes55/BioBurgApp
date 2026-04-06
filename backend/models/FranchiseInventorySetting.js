import mongoose from "mongoose";

const FranchiseInventorySettingSchema = new mongoose.Schema(
  {
    franchiseAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchiseAccount",
      required: true,
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
      default: null,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    targetStock: {
      type: Number,
      default: 25,
      min: 0,
    },
    preferredRestockQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    lastUpdatedBy: {
      type: String,
      default: "franchise",
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

FranchiseInventorySettingSchema.index(
  { franchiseAccountId: 1, productId: 1 },
  { unique: true },
);

export default mongoose.model(
  "FranchiseInventorySetting",
  FranchiseInventorySettingSchema,
);
