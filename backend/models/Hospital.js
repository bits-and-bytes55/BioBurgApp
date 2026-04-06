// models/Hospital.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const hospitalSchema = new mongoose.Schema({

  // ── Facility Info 
  facilityName:       { type: String, required: [true, 'Hospital name is required'], trim: true },
  facilityType:       { type: String, default: 'hospital' },
  registrationNumber: { type: String, required: true, unique: true, trim: true },
  licenseNumber:      { type: String, required: true, trim: true },
  establishedYear:    { type: Number, required: true },
  numberOfBeds:       { type: Number, default: null },
  gstNumber:          { type: String, default: null, trim: true },
  panNumber:          { type: String, default: null, trim: true },

  // ── Profile Photos & Documents 
  profilePhotoUrl:          { type: String, default: null },
  profilePhotoPublicId:     { type: String, default: null },
  registrationCertUrl:      { type: String, default: null },
  registrationCertPublicId: { type: String, default: null },
  licenseCertUrl:           { type: String, default: null },
  licenseCertPublicId:      { type: String, default: null },
  ownerIdDocUrl:            { type: String, default: null },
  ownerIdDocPublicId:       { type: String, default: null },
  buildingPermitUrl:        { type: String, default: null },
  buildingPermitPublicId:   { type: String, default: null },

  // ── UI / Theme Preferences 
  themeColor: { type: String, default: '#0369a1' },
  themeMode:  { type: String, enum: ['light', 'dark'], default: 'light' },
  themeName:  { type: String, default: 'default' },

  // ── Contact 
  contactPerson:  { type: String, required: true, trim: true },
  designation:    { type: String, default: null },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  phone:          { type: String, required: true, match: [/^\d{10}$/, 'Must be 10 digits'] },
  alternatePhone: { type: String, default: null },

  // ── Address 
  address: { type: String, required: true },
  city:    { type: String, required: true, trim: true },
  state:   { type: String, required: true, trim: true },
  pinCode: { type: String, required: true, match: [/^\d{6}$/, 'Must be 6 digits'] },

  // ── Services & Specializations 
  emergencyServices:  { type: Boolean, default: false },
  ambulanceService:   { type: Boolean, default: false },
  pharmacy24x7:       { type: Boolean, default: false },
  icuAvailable:       { type: Boolean, default: false },
  specializations:    { type: [String], default: [] },
  operatingHoursFrom: { type: String, default: '09:00' },
  operatingHoursTo:   { type: String, default: '18:00' },

  // ── Security 
  password: { type: String, required: true, minlength: 6, select: false },

  // ── Login Tracking 
  lastLoginAt: { type: Date,   default: null },
  lastLoginIp: { type: String, default: null },
  loginCount:  { type: Number, default: 0 },

  // ── Status & Approval 
  status:                  { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isVerified:              { type: Boolean, default: false },
  isActive:                { type: Boolean, default: true },
  isApproved:              { type: Boolean, default: false },
  approvedBy:              { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvedAt:              { type: Date,   default: null },
  rejectionReason:         { type: String, default: null },
  verificationToken:       { type: String, default: null },
  verificationTokenExpiry: { type: Date,   default: null },



}, { timestamps: true });

// ── Hash password before save 
hospitalSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

hospitalSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;