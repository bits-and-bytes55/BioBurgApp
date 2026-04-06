import mongoose from "mongoose";
import bcrypt    from "bcryptjs";

const deliveryAgentSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    // ── Auto-generated agent ID ───────────────────────────────────────
    agentId: { type: String, unique: true, sparse: true },

    // ── Role & Zone ───────────────────────────────────────────────────
    role:         { type: String, default: "delivery_agent" },
    assignedArea: { type: String, default: "" },

    // ── Vehicle ───────────────────────────────────────────────────────
    vehicleType: {
      type: String,
      enum: ["bike", "scooter", "car", "van", "cycle"],
      default: "bike",
      set: (v) => v ? v.toLowerCase() : "bike",
    },
    vehicleNumber: { type: String, uppercase: true, trim: true, default: "" },

    // ── Document numbers ─────────────────────────────────────────────
    drivingLicence: { type: String, uppercase: true, trim: true, default: "" },
    panCard: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
      validate: {
        validator: (v) => !v || /^[A-Z]{5}\d{4}[A-Z]$/.test(v),
        message: "Invalid PAN format (e.g. ABCDE1234F)",
      },
    },

    // ── Uploaded document URLs (Cloudinary secure_url) ───────────────
    documents: {
      aadhaar:       { type: String, default: null },
      licenceCopy:   { type: String, default: null },
      vehicleRC:     { type: String, default: null },
      passportPhoto: { type: String, default: null },
      upiQrImage:    { type: String, default: null },
    },

    // ── Bank & Payment ────────────────────────────────────────────────
    bankDetails: {
      accountNumber:     { type: String, trim: true, default: "" },
      ifscCode:          { type: String, uppercase: true, trim: true, default: "" },
      bankName:          { type: String, trim: true, default: "" },
      accountHolderName: { type: String, trim: true, default: "" },
    },
    upiId: { type: String, trim: true, default: "" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended", "draft"],
      default: "pending",
    },

    approvalNote:    { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    approvedAt:      { type: Date, default: null },

    // ── Draft / Partial Revision ──────────────────────────────────────
  
    fieldsToRevise: { type: [String], default: [] }, 
    draftNote:      { type: String, default: "" },  
    draftSentAt:    { type: Date, default: null },    

    // ── Online / Offline ──────────────────────────────────────────────
    availability: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },

    isActive: { type: Boolean, default: true },

    // ── Active order ──────────────────────────────────────────────────
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Order",
      default: null,
    },

    // ── Delivery stats ────────────────────────────────────────────────
    totalDeliveries:      { type: Number, default: 0 },
    totalEarnings:        { type: Number, default: 0 },
    thisMonthDeliveries:  { type: Number, default: 0 },
    thisMonthEarnings:    { type: Number, default: 0 },
    avgRating:            { type: Number, default: 0 },
    totalRatings:         { type: Number, default: 0 },

    // ── Commission & Incentive ────────────────────────────────────────
    commission:               { type: Number, default: 7, min: 0, max: 100 },
    incentive:                { type: Number, default: 400 },
    incentiveDeliveryTarget:  { type: Number, default: 100 },

    // ── GPS location ──────────────────────────────────────────────────
    location: {
      lat:       { type: Number, default: null },
      lng:       { type: Number, default: null },
      updatedAt: { type: Date,   default: null },
    },

    // ── Push notification token ───────────────────────────────────────
    fcmToken: { type: String, default: null },
  },
  { timestamps: true }
);

// ── Auto-generate agentId on first save ───────────────────────────────────────
deliveryAgentSchema.pre("save", async function (next) {
  if (!this.agentId) {
    const count  = await mongoose.model("DeliveryAgent").countDocuments();
    this.agentId = `DA${String(count + 1).padStart(4, "0")}`;
  }
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ── Instance methods ──────────────────────────────────────────────────────────
deliveryAgentSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

deliveryAgentSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("DeliveryAgent", deliveryAgentSchema);