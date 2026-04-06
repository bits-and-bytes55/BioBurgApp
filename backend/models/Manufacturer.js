import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: String,
    originalName: String,
  },
  { _id: false },
);

const manufacturerSchema = new mongoose.Schema(
  {
    // Personal
    fullName: String,
    gender: String,
    dob: String,
    personalMobile: String,

    // Company
    companyName: String,
    companyType: String,
    yearEst: String,
    corpRegNum: String,
    headOfficeAddress: String,
    factoryAddress: String,

    // Contact
    officialEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    officialContact: String,
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    // Authorized person
    authName: String,
    authDesignation: String,
    authMobile: String,
    authEmail: String,

    // Auth
    password: {
      type: String,
      required: true,
    },

    // Manufacturing
    productTypes: [String],
    productionCapacity: String,
    licenseNumber: String,
    qualityCerts: [String],
    mfgAccepted: [String],
    moq: String,
    businessTerms: String,

    // Banking
    bankName: String,
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    paymentMethod: String,

    // Documents
    documents: {
      licenseFile: fileSchema,
      gmpCertFile: fileSchema,
      isoCertFile: fileSchema,
      productListFile: fileSchema,
      qualityTestDocs: fileSchema,
    },

    // Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    applicationStatus: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    documentReviewStatus: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "VERIFIED", "ISSUES_FOUND"],
      default: "PENDING",
    },
    accountStatus: {
      type: String,
      enum: ["PENDING_APPROVAL", "ACTIVE", "BLOCKED"],
      default: "PENDING_APPROVAL",
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Manufacturer", manufacturerSchema);
