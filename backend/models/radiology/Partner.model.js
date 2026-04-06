import mongoose from "mongoose";

const PartnerSchema = new mongoose.Schema(
  {
    // STEP 1
    businessName: { type: String, required: true },
    ownerName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    businessType: { type: String, required: true },
    yearEst: String,

    // STEP 2
    gstNumber: { type: String, required: true },
    regNumber: { type: String, required: true },
    address: { type: String, required: true },
    city: String,
    state: String,
    pincode: String,

    // STEP 3
    servicesOffered: [String],
    homeCollection: String,
    notes: String,

    // STEP 4 (DIRECT CLOUDINARY DATA)
    regCertificate: {
      url: String,
      public_id: String,
    },
    gstCertificate: {
      url: String,
      public_id: String,
    },
    ownerID: {
      url: String,
      public_id: String,
    },
    labPhotos: {
      url: String,
      public_id: String,
    },

    consent: Boolean,

    // ADMIN CONTROL
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: String,
  },
  { timestamps: true }
);

export default mongoose.model("Partner", PartnerSchema);
