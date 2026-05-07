import mongoose from "mongoose";

const employeeIDCardSchema = new mongoose.Schema(
  {
    employeeRef:  { type: mongoose.Schema.Types.ObjectId, refPath: "sourceModel" },
    sourceModel:  { type: String, enum: ["MarketingAgent", "JobApplication", "ExServiceApplication"] },
    employeeId:   { type: String, required: true, unique: true },
    name:         { type: String, required: true },
    email:        { type: String },
    phone:        { type: String },
    source:       { type: String, enum: ["Marketing Agent", "Jobs & Careers", "Ex-Servicemen", "Manual"] },
    designation:  { type: String },
    department:   { type: String },
    location:     { type: String, default: "India" },
    validTill:    { type: Date },
    dateOfBirth:  { type: Date },
    
    photo:           { type: String },           
    photoPublicId:   { type: String },          

    cardImage:          { type: String },        
    cardImagePublicId:  { type: String },

    cardImageBack:         { type: String },
    cardImageBackPublicId: { type: String },

    issuedAt:   { type: Date, default: Date.now },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

const EmployeeIDCard = mongoose.model("EmployeeIDCard", employeeIDCardSchema);
export default EmployeeIDCard;