import mongoose from "mongoose";

const ExServiceJobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String },
  location: { type: String },
  salary: { type: String },
  jobType: { type: String, enum: ["Full-Time","Part-Time","Contract","Consultant"], default: "Full-Time" },
  serviceArm: { type: String, enum: ["Army","Navy","Air Force","Any"], default: "Any" },
  minRank: { type: String },
  minServiceYears: { type: Number, default: 0 },
  description: { type: String },
  responsibilities: { type: String },
  preferredSkills: { type: String },
  status: { type: String, enum: ["active","inactive"], default: "active" },
}, { timestamps: true });

export default mongoose.model("ExServiceJob", ExServiceJobSchema);