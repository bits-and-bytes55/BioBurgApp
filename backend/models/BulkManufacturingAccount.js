import mongoose from "mongoose";

const bulkManufacturingAccountSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkManufacturingRequest",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "BULK_MANUFACTURER",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
    companyName: {
      type: String,
      default: "",
      trim: true,
    },
    contactName: {
      type: String,
      default: "",
      trim: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },
    mobile: {
      type: String,
      default: "",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    country: {
      type: String,
      default: "",
      trim: true,
    },
    website: {
      type: String,
      default: "",
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    resetPasswordOtp: {
      type: String,
      default: undefined,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model(
  "BulkManufacturingAccount",
  bulkManufacturingAccountSchema,
);
