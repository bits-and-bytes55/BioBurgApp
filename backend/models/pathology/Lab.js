import mongoose from "mongoose";

const LabSchema = new mongoose.Schema(
  {
    // Basic info
    fullName: { type: String, required: true },      // lab name / business name
    ownerName: { type: String },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // Auth
    password: { type: String, required: true },
    role: { type: String, default: "LAB" },

    // Lab details
    labType: { type: String, default: "Pathology Laboratory" },
    businessType: { type: String },
    yearEst: { type: String },
    homeCollection: { type: String, enum: ["Yes", "No", ""], default: "" },
    notes: { type: String },

    // Services — lab can add predefined OR custom service names
    servicesOffered: {
      type: [String],
      default: [],
    },

    // Status (admin approves)
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: { type: String },

    // Documents
    regCertificate: { url: String, public_id: String },
    gstCertificate: { url: String, public_id: String },
    ownerID: { url: String, public_id: String },
    labPhotos: { url: String, public_id: String },
  },
  { timestamps: true }
);

export default mongoose.model("Lab", LabSchema);