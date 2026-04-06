import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
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

const bulkManufacturingRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, default: "" },
    dob: { type: String, default: "" },
    mobile: { type: String, required: true, trim: true },
    designation: { type: String, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, default: "" },

    companyName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    orgType: { type: String, required: true, trim: true },
    yearEst: { type: String, default: "" },
    website: { type: String, default: "" },

    importLicenseNum: { type: String, default: "" },
    taxId: { type: String, default: "" },

    products: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    destinationCountry: { type: String, required: true, trim: true },
    port: { type: String, default: "" },
    purpose: { type: String, required: true, trim: true },
    storageReq: { type: String, default: "" },

    shippingMethod: { type: String, default: "" },
    customsBroker: { type: String, default: "" },
    customsAssist: { type: String, default: "No" },

    paymentMethod: { type: String, required: true, trim: true },
    currency: { type: String, default: "" },

    requestedUsername: { type: String, default: "" },

    documents: {
      importLicenseFile: { type: String, default: "" },
      gdpCert: { type: String, default: "" },
      buyerLetter: { type: String, default: "" },
      proofOfFunds: { type: String, default: "" },
      companyRegCert: { type: String, default: "" },
      passportCopy: { type: String, default: "" },
      companyProfile: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewNotes: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    documentReviewStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "ISSUES_FOUND"],
      default: "PENDING",
    },
    documentReviewNotes: { type: String, default: "" },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkManufacturingAccount",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: "" },
    leadSource: { type: String, default: "WEB_FORM" },
    statusHistory: {
      type: [statusHistorySchema],
      default: [{ status: "PENDING", note: "Application submitted", actor: "Applicant" }],
    },
  },
  { timestamps: true },
);

export default mongoose.model(
  "BulkManufacturingRequest",
  bulkManufacturingRequestSchema,
);
