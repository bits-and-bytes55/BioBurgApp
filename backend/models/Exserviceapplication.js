import mongoose from "mongoose";

const ExServiceApplicationSchema = new mongoose.Schema({
  // Personal
  fullName:        { type: String, required: true },
  email:           { type: String, required: true },
  phone:           { type: String, required: true },
  dateOfBirth:     { type: String },
  gender:          { type: String },

  // Address
  address:         { type: String },
  city:            { type: String },
  state:           { type: String },
  pinCode:         { type: String },

  // Military Service Details
  serviceArm:      { type: String },
  rank:            { type: String },
  serviceNumber:   { type: String },
  yearsOfService:  { type: String },
  dischargeType:   { type: String },
  serviceRecord:   { type: String },
  medals:          { type: String },

  // Civilian Transition
  civilianQualification: { type: String },
  fieldOfStudy:    { type: String },
  civilianExperience: { type: String },
  currentJobTitle: { type: String },
  skills:          { type: String },
  expectedSalary:  { type: String },
  noticePeriod:    { type: String },
  preferredLocation: { type: String },
  linkedIn:        { type: String },

  // Application
  applyingFor:     { type: String, required: true },
  coverLetter:     { type: String },
  resumeUrl:       { type: String },

  // Admin — status (Reports page: pending/reviewing/shortlisted/rejected/hired)
  status: {
    type: String,
    enum: ["pending", "reviewing", "shortlisted", "rejected", "hired"],
    default: "pending",
  },
  adminNote: { type: String },

  // Admin — pipeline stage (Tracking page: 6-step recruitment pipeline)
  stage: {
    type: String,
    enum: [
      "application_filled",
      "online_test",
      "result",
      "interview",
      "offer_letter",
      "joining",
    ],
    default: "application_filled",
  },

}, { timestamps: true });

export default mongoose.model("ExServiceApplication", ExServiceApplicationSchema);