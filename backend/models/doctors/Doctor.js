import mongoose from "mongoose";
import bcrypt from "bcryptjs";
 
const DoctorSchema = new mongoose.Schema({
  fullName:          { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  password:          { type: String, required: true, select: false },
  mobile:            { type: String },
  gender:            { type: String, enum: ["Male", "Female", "Other"] },
  specialization:    { type: String, required: true },
  qualification:     { type: String },
  experience:        { type: Number, default: 0 },
  regNumber:         { type: String },
  consultationFee:   { type: Number, default: 0 },
  rating:            { type: Number, default: 0 },
  reviews:           { type: Number, default: 0 },
  languages:         [{ type: String }],
  consultationModes: [{ type: String }],
  about:             { type: String },
  affiliation:       { type: String },
  notes:             { type: String },
 
  // Cloudinary photo
  photo:             { type: String, default: "" },
  photoPublicId:     { type: String, default: "" },  
 
  available:         { type: Boolean, default: false },
  nextSlot:          { type: String },
  status:            { type: String, enum: ["pending", "approved", "blocked"], default: "pending" },
 
  availability: {
    days:  [{ type: String }],
    slots: [{ from: String, to: String }],
  },
 
  // Other uploaded document URLs (can also be Cloudinary URLs)
  documents: {
    medicalDegree:    { type: String },
    registrationCert: { type: String },
    idProof:          { type: String },
  },
}, { timestamps: true });
 
DoctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
 
DoctorSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};
 
export default mongoose.model("Doctor", DoctorSchema);
 