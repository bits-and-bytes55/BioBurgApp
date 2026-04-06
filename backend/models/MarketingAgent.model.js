import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const jobSchema = new mongoose.Schema({
  jobStartTime: { type: Date, default: Date.now },
  jobEndTime: Date,

  startKm: { type: Number, default: 0 },
  closeKm: Number,
  totalDistanceKm: Number,

  routePath: [
    {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      speed: Number,
      recordedAt: { type: Date, default: Date.now }
    }
  ],

  state: String,
  district: String,
  area: String,
  address: String,
  latitude: Number,
  longitude: Number,

  partner: { type: String, enum: ["Doctor", "Hospital", "Medical"] },
  hospitalName: String,
  doctorName: String,
  degree: String,
  mobile: String,
  whatsapp: String,

  startKmPhoto: { url: String, public_id: String },
  closeKmPhoto: { url: String, public_id: String },
  hospitalImage: { url: String, public_id: String },

  jobStatus: {
    type: String,
    enum: ["started", "closed", "force_closed"],
    default: "started"
  }
});

const responseSchema = new mongoose.Schema(
  {
    placeName:        { type: String, required: true },
    placeType:        { type: String, default: "Hospital" },
    address:          String,
    contactPerson:    { type: String, required: true },
    contactRole:      String,
    phone:            String,
    responseStatus:   { type: String, default: "Responded - Positive" },
    productDiscussed: String,
    remarks:          String,
    nextAction:       { type: String, default: "None Required" },
    followUpDate:     String,
    hasOrder:         { type: Boolean, default: false },
    orderValue:       String
  },
  { timestamps: true }   
);

const marketingAgentSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    assignedArea: String,
    role: { type: String, default: "marketing_agent" },
    
    vendor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Vendor",
  required: false
},

    isOnJob: { type: Boolean, default: false },

    currentLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      speed: Number,
      updatedAt: Date
    },

    gpsViolationCount: { type: Number, default: 0 },
    isGpsBlocked: { type: Boolean, default: false },

    jobHistory: [jobSchema],
    responses: [responseSchema] 
  },
  { timestamps: true }
);

marketingAgentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

marketingAgentSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("MarketingAgent", marketingAgentSchema);
