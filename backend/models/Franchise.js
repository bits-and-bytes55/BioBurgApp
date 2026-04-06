import mongoose from "mongoose";

const FranchiseSchema = new mongoose.Schema({
  // Step 1
  fullName: String,
  gender: String,
  dob: String,
  mobile: String,
  email: String,
  isDoctor: String,
  pathyExpertise: String,
  patientsPerDay: String,

  // Step 2
  agreementRating: String,
  additionalSupport: [String],
  otherSupportText: String,
  similarBusiness: String,
  concerns: [String],
  otherConcernText: String,
  challenges: [String],
  otherChallengeText: String,

  // Step 3
  investmentBandwidth: String,
  franchiseModel: String,
  investmentTimeline: String,
  roiExpectation: String,
  investingCapacity: String,
  multipleFranchises: String,
  numberOfStores: String,
  appealingAspects: [String],

  // Step 4
  nearbyPharmacy: String,
  whyBioburg: String,
  legalDisputes: String,
  citiesOfInterest: String,
  locality: String,
  marketConnect: String,
  locationType: String,
  otherAppealingText: String,
  comments: String,

  documents: {
    profilePhoto: String,
    governmentId: String,
    addressProof: String,
    businessProof: String,
  },

  kycStatus: {
    type: String,
    enum: ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"],
    default: "PENDING",
  },

  kycNotes: {
    type: String,
    default: "",
  },

  rejectionReason: {
    type: String,
    default: "",
  },

  lifecycleNotes: [
    {
      action: {
        type: String,
        default: "",
      },
      note: {
        type: String,
        default: "",
      },
      actor: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  zoneHistory: [
    {
      zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Zone",
      },
      zoneName: {
        type: String,
        default: "",
      },
      action: {
        type: String,
        default: "",
      },
      note: {
        type: String,
        default: "",
      },
      assignedBy: {
        type: String,
        default: "",
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  },

  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Zone"
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Franchise", FranchiseSchema);
