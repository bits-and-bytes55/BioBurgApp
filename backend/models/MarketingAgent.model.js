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
      recordedAt: { type: Date, default: Date.now },
    },
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

  visitTime: String,
  doctorFeedback: String,
  nextVisitDate: Date,

  productsDetailed: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, default: 1 },
    },
  ],

  samplesGiven: [
    {
      productName: { type: String, required: true },
      quantity: { type: Number, default: 1 },
    },
  ],

  startProofImage: {
    url: String,
    public_id: String,
    uploadedAt: Date,
  },
  startKmPhoto: { url: String, public_id: String },
  closeKmPhoto: { url: String, public_id: String },
  hospitalImage: { url: String, public_id: String },

  visits: [
    {
      place: String,
      area: String,
      address: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],

  jobStatus: {
    type: String,
    enum: ["started", "closed", "force_closed"],
    default: "started",
  },
});

const responseSchema = new mongoose.Schema(
  {
    placeName: { type: String, required: true },
    placeType: {
      type: String,
      default: "Hospital",
      enum: [
        "Hospital",
        "Clinic",
        "Medical Store",
        "Distributor",
        "Diagnostic Centre",
        "Path Lab",
        "EOD",
        "Other",
        "Nursing Home",
        "Doctor Chamber",
        "Pharmacy",
        "Corporate Office",
        "Retail Shop",
        "Wholesaler",
        "Factory",
        "School",
        "Hotel",
      ],
    },
    address: String,
    state: String,
    district: String,
    city: String,
    pincode: String,
    contactPerson: { type: String, required: true },
    contactRole: String,
    phone: String,
    alternatePhone: String,
    whatsappPhone: String,
    gst: String,
    licenses: [String],
    designation: String,
    qualification: String,
    dob: String,
    anniversary: String,
    responseStatus: { type: String, default: "Responded - Positive" },
    productDiscussed: String,
    remarks: String,
    nextAction: { type: String, default: "None Required" },
    followUpDate: String,
    hasOrder: { type: Boolean, default: false },
    orderValue: { type: Number, default: 0 },
    linkedOrderId: String,
  },
  { timestamps: true }
);

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["email", "social", "whatsapp", "sms"],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
    subject: String,
    message: { type: String, required: true },
    recipients: [String],
    scheduledAt: Date,
    sentAt: Date,
    reach: { type: Number, default: 0 },
    opens: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    platform: String,
    imageUrl: String,
    tags: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent" },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    placeName: { type: String, required: true },
    placeType: { type: String, default: "Hospital" },
    placeTypeOther: String,
    address: String,
    city: String,

    contactPerson: { type: String, required: true },
    contactRole: String,
    contactRoleOther: String,
    phone: String,
    whatsapp: String,
    email: String,

    stage: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
        "Follow Up",
      ],
      default: "New",
    },
    stageHistory: [
      {
        stage: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    source: { type: String, default: "DCR Visit" },
    sourceOther: String,
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Hot"],
      default: "Medium",
    },

    productInterest: String,
    productInterestOther: String,
    estimatedValue: String,

    nextAction: { type: String, default: "Call Tomorrow" },
    nextActionOther: String,
    followUpDate: String,

    notes: String,
    fromResponseId: String,
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema({
  ticketId: String,
  subject: { type: String, required: true },
  category: { type: String, required: true },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium",
  },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open",
  },
  contactPhone: { type: String, default: "" },
  contactEmail: { type: String, default: "" },
  attachmentNote: { type: String, default: "" },
  adminReply: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const workflowSchema = new mongoose.Schema({
  title: { type: String, required: true },
  workflowType: { type: String, required: true },
  department: { type: String, required: true },
  currentStage: { type: String, required: true },
  priority: {
    type: String,
    enum: ["Low", "Normal", "High", "Urgent"],
    default: "Normal",
  },
  description: { type: String, required: true },
  contactPerson: { type: String, default: "" },
  contactPhone: { type: String, default: "" },
  estimatedDays: { type: Number, default: null },
  dueDate: { type: Date, default: null },
  remarks: { type: String, default: "" },
  stageHistory: [
    {
      stage: String,
      note: String,
      changedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const marketingAgentSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    assignedArea: String,

    role: {
      type: String,
      trim: true,
      default: "marketing_agent",
    },

    permissions: {
      allAgentsAccess: { type: Boolean, default: false },
      dashboard: { type: Boolean, default: true },
      workingPlan: { type: Boolean, default: true },
      dcr: { type: Boolean, default: true },
      geoTracking: { type: Boolean, default: true },
      routePlanning: { type: Boolean, default: true },
      dailyExpenses: { type: Boolean, default: true },
      workPerformance: { type: Boolean, default: true },
      jobActivity: { type: Boolean, default: true },
      responses: { type: Boolean, default: true },
      products: { type: Boolean, default: true },
      giftManagement: { type: Boolean, default: true },
      productFeedback: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
      targets: { type: Boolean, default: true },
      pointsPayout: { type: Boolean, default: true },
      marketing: { type: Boolean, default: true },
      visualAds: { type: Boolean, default: true },
      leads: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      staff: { type: Boolean, default: false },
      training: { type: Boolean, default: true },
      support: { type: Boolean, default: true },
      calendar: { type: Boolean, default: true },
      profile: { type: Boolean, default: true },
    },

    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      default: null,
    },

    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MarketingAgent",
      },
    ],

    level: {
      type: Number,
      default: 1,
    },

    monthlyExpenseBudget: {
      type: Number,
      default: 8000,
      min: 0,
    },

    campaigns: [campaignSchema],
    leads: [leadSchema],

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: false,
    },

    monthlyTarget: {
      jobs: { type: Number, default: 0 },
      doctors: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      revenueTarget: { type: Number, default: 0 },
    },

    sampleStock: [
      {
        productName: String,
        openingStock: { type: Number, default: 0 },
        issued: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    jobStartRequirements: {
      requireLocation: { type: Boolean, default: true },
      requireImage: { type: Boolean, default: false },
    },

    geofence: {
      latitude: Number,
      longitude: Number,
      radiusKm: { type: Number, default: 50 },
      enabled: { type: Boolean, default: false },
    },

    isOnJob: { type: Boolean, default: false },
    gpsViolationCount: { type: Number, default: 0 },
    isGpsBlocked: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },

    currentLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      speed: Number,
      updatedAt: Date,
    },

    jobHistory: [jobSchema],
    responses: [responseSchema],

    supportTickets: [supportTicketSchema],
    workflows: [workflowSchema],
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
