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

  visitTime:    String,                        
  doctorFeedback: String,                     
  nextVisitDate:  Date,                     

  productsDetailed: [                         
    {
      name:     { type: String, required: true },
      quantity: { type: Number, default: 1 },
    }
  ],

  samplesGiven: [                         
    {
      productName: { type: String, required: true },
      quantity:    { type: Number, default: 1 },
    }
  ],

  // Start-of-job proof
  startProofImage: {
    url: String,
    public_id: String,
    uploadedAt: Date,
  },
  startKmPhoto:  { url: String, public_id: String },
  closeKmPhoto:  { url: String, public_id: String },
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
    placeName:        { type: String, required: true },
    placeType: {
      type: String,
      default: "Hospital",
      enum: ["Hospital", "Clinic", "Medical Store", "Distributor",
             "Diagnostic Centre", "Path Lab", "EOD", "Other"],
    },
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
    orderValue:       String,
  },
  { timestamps: true }
);

const campaignSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    type: {
      type:    String,
      enum:    ["email", "social", "whatsapp", "sms"],
      required: true,
    },
    status: {
      type:    String,
      enum:    ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
    subject:     String,              // email only
    message:     { type: String, required: true },
    recipients:  [String],            // emails / phones / handles
    scheduledAt: Date,
    sentAt:      Date,
    reach:       { type: Number, default: 0 },
    opens:       { type: Number, default: 0 },
    clicks:      { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    platform:    String,              // social: instagram / facebook / twitter / linkedin
    imageUrl:    String,
    tags:        [String],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent" },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    // Place
    placeName:        { type: String, required: true },
    placeType:        { type: String, default: 'Hospital' },
    placeTypeOther:   String,
    address:          String,
    city:             String,
 
    // Contact
    contactPerson:    { type: String, required: true },
    contactRole:      String,
    contactRoleOther: String,
    phone:            String,
    whatsapp:         String,
    email:            String,
 
    // Lead meta
    stage: {
      type: String,
      enum: ['New','Contacted','Qualified','Proposal','Negotiation','Won','Lost','Follow Up'],
      default: 'New',
    },
    stageHistory: [
      {
        stage:     String,
        changedAt: { type: Date, default: Date.now },
      }
    ],
 
    source:          { type: String, default: 'DCR Visit' },
    sourceOther:     String,
    priority:        { type: String, enum: ['Low','Medium','High','Hot'], default: 'Medium' },
 
    productInterest:      String,
    productInterestOther: String,
    estimatedValue:       String,
 
    nextAction:      { type: String, default: 'Call Tomorrow' },
    nextActionOther: String,
    followUpDate:    String,
 
    notes:           String,
 
    // Link to origin response (if converted)
    fromResponseId:  String,
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema({
  ticketId:       { type: String },
  subject:        { type: String, required: true },
  category:       { type: String, required: true },
  priority:       { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  description:    { type: String, required: true },
  status:         { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  contactPhone:   { type: String, default: "" },
  contactEmail:   { type: String, default: "" },
  attachmentNote: { type: String, default: "" },
  adminReply:     { type: String, default: "" },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
});
 
const workflowSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  workflowType:  { type: String, required: true },
  department:    { type: String, required: true },
  currentStage:  { type: String, required: true },
  priority:      { type: String, enum: ["Low", "Normal", "High", "Urgent"], default: "Normal" },
  description:   { type: String, required: true },
  contactPerson: { type: String, default: "" },
  contactPhone:  { type: String, default: "" },
  estimatedDays: { type: Number, default: null },
  dueDate:       { type: Date, default: null },
  remarks:       { type: String, default: "" },
  stageHistory: [
    {
      stage:     String,
      note:      String,
      changedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const marketingAgentSchema = new mongoose.Schema(
  {
    name:     String,
    email:    { type: String, unique: true },
    phone:    String,
    password: String,
    assignedArea: String,
    role: { type: String, default: "marketing_agent" },

    monthlyExpenseBudget: {
      type:    Number,
      default: 8000,
      min:     0,
    },

    campaigns: [campaignSchema],
    leads: [leadSchema],
    
    vendor: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Vendor",
      required: false,
    },

    monthlyTarget: {
      jobs:          { type: Number, default: 0 },
      doctors:       { type: Number, default: 0 },
      orders:        { type: Number, default: 0 },
      revenueTarget: { type: Number, default: 0 },
    },

    sampleStock: [
      {
        productName:  String,
        openingStock: { type: Number, default: 0 },
        issued:       { type: Number, default: 0 },
        balance:      { type: Number, default: 0 },
        updatedAt:    { type: Date, default: Date.now },
      },
    ],

    jobStartRequirements: {
      requireLocation: { type: Boolean, default: true },
      requireImage:    { type: Boolean, default: false },
    },

    geofence: {
      latitude:  Number,
      longitude: Number,
      radiusKm:  { type: Number, default: 50 },
      enabled:   { type: Boolean, default: false },
    },

    isOnJob:           { type: Boolean, default: false },
    gpsViolationCount: { type: Number,  default: 0 },
    isGpsBlocked:      { type: Boolean, default: false },
    isApproved:        { type: Boolean, default: false },

    currentLocation: {
      latitude:  Number,
      longitude: Number,
      accuracy:  Number,
      speed:     Number,
      updatedAt: Date,
    },

    jobHistory: [jobSchema],
    responses:  [responseSchema],

    supportTickets: [supportTicketSchema],
    workflows:      [workflowSchema],
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