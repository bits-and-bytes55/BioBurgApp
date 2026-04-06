import mongoose from "mongoose";

const LabTestSchema = new mongoose.Schema({
  fullName: String,
  gender: String,
  age: String,
  phone: String,
  altPhone: String,
  email: String,
  address: String,
  city: String,
  state: String,
  pincode: String,

  selectedTests: [String],
  collectionType: String,
  preferredDate: String,
  timeSlot: String,
  medicalCondition: String,

  prescription: String, 
  previousReports: String,

  paymentMethod: String,
  totalAmount: Number,

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("LabTest", LabTestSchema);
