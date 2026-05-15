import mongoose from "mongoose";

const employeeIDCardSchema = new mongoose.Schema(
  {
    employeeRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sourceModel",
    },

    sourceModel: {
      type: String,
      enum: [
        "MarketingAgent",
        "JobApplication",
        "ExServiceApplication",
        "DeliveryAgent",
      ],
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: { type: String },
    phone: { type: String },

    source: {
      type: String,
      enum: [
        "Marketing Agent",
        "Jobs & Careers",
        "Ex-Servicemen",
        "Delivery Agent",
        "Manual",
      ],
    },

    designation: { type: String },
    department: { type: String },
    location: { type: String, default: "India" },
    validTill: { type: Date },
    dateOfBirth: { type: Date },

    photo: { type: String },
    photoPublicId: { type: String },

    cardImage: { type: String },
    cardImagePublicId: { type: String },

    cardImageBack: { type: String },
    cardImageBackPublicId: { type: String },

    cardColors: {
      teal: { type: String },
      yellow: { type: String },
      navy: { type: String },
      nameColor: { type: String },
      designationColor: { type: String },
    },

    cardGlobalContent: {
      type: mongoose.Schema.Types.Mixed,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeIDCard", employeeIDCardSchema);
