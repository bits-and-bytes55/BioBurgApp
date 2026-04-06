import mongoose from "mongoose";

const LabBookingSchema = new mongoose.Schema(
  {

userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: false,
  default: null,
},
partnerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Partner",
  required: false,
  default: null,
},
    // Which lab
    labId: { type: mongoose.Schema.Types.ObjectId, ref: "Lab" },
    labName: { type: String },

    // Patient info
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String },
    dob: { type: String },
    gender: { type: String },
    bloodGroup: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },

    // Test details
    serviceType: { type: String },
    selectedTests: [String],
    bodyPart: { type: String },
    contrast: { type: String },
    clinicalIndication: { type: String },
    fastingHours: { type: String },
    medHistory: { type: String },

    // Safety screening
    claustrophobia: { type: String },
    pregnant: { type: String },
    pacemaker: { type: String },
    metalImplants: { type: String },
    kidneyDisease: { type: String },
    allergies: [String],

    // Referring doctor
    refDocName: { type: String },
    refDocSpec: { type: String },

    // Appointment
    apptDate: { type: String },
    apptSlot: { type: String },
    collectionType: { type: String },
    paymentMode: { type: String },

    // Status
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },

    // Report (uploaded by lab)
    reportFile: {
      url: { type: String },
      public_id: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("LabBooking", LabBookingSchema);