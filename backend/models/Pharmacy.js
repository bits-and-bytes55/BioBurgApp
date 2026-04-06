import mongoose from "mongoose";
import bcrypt from "bcrypt";

const pharmacySchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────────────────────────
    facilityName:       { type: String, required: [true, "Pharmacy name is required"], trim: true },
    facilityType:       { type: String, default: "pharmacy" },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    licenseNumber:      { type: String, required: true, trim: true },
    drugLicenseNumber:  { type: String, default: null, trim: true },
    establishedYear:    { type: Number, required: true },
    gstNumber:          { type: String, default: null, trim: true },
    panNumber:          { type: String, default: null, trim: true },

    // ── Contact ────────────────────────────────────────────────────────────────
    contactPerson:  { type: String, required: true, trim: true },
    designation:    { type: String, default: null },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    phone:          { type: String, required: true, match: [/^\d{10}$/, "Must be 10 digits"] },
    alternatePhone: { type: String, default: null },   // ← NEW
    whatsappNumber: { type: String, default: null },   // ← NEW

    // ── Address ────────────────────────────────────────────────────────────────
    address: { type: String, required: true },
    city:    { type: String, required: true, trim: true },
    state:   { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, match: [/^\d{6}$/, "Must be 6 digits"] },

    // ── Profile Photo (base64 data URL) ───────────────────────────────────────
    profilePhoto: { type: String, default: null },
    logoUrl:      { type: String, default: null },
    brandColor:   { type: String, default: "#059669" },

    // ── Pharmacy Services ──────────────────────────────────────────────────────
    homeDelivery:       { type: Boolean, default: false },
    pharmacy24x7:       { type: Boolean, default: false },
    onlinePrescription: { type: Boolean, default: false },
    genericMedicines:   { type: Boolean, default: false },

    // ── Operating Hours ────────────────────────────────────────────────────────
    operatingHoursFrom: { type: String, default: "09:00" },
    operatingHoursTo:   { type: String, default: "21:00" },

    // ── Security ───────────────────────────────────────────────────────────────
    password: { type: String, required: true, minlength: 6, select: false },

    // ── Login History (last 50 logins stored) ─────────────────────────────────
    loginHistory: {
      type: [
        {
          ip:      { type: String },
          device:  { type: String },
          browser: { type: String },
          time:    { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    lastLoginAt:  { type: Date, default: null },       
    lastLoginIp:  { type: String, default: null },     

    //Status 
    status:     { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },

    // Admin Approval 
    approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    approvedAt:      { type: Date, default: null },
    rejectionReason: { type: String, default: null },

    // Tokens 
    verificationToken:       { type: String, default: null },
    verificationTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before save
pharmacySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
pharmacySchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
export default Pharmacy;