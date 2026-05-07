import mongoose from "mongoose";

// Task sub-schema — all fields the frontend sends 
const taskSchema = new mongoose.Schema(
  {
    // Core scheduling
    date:         { type: String, default: "" },
    dayOfWeek:    { type: String, default: "" },
    timeSlot:     { type: String, default: "" },
    bufferFrom:   { type: String, default: "" },
    bufferTo:     { type: String, default: "" },

    // Activity
    activity:     { type: String, default: "" },
    subActivity:  { type: String, default: "" },

    // Location
    location:     { type: String, default: "" },
    locationType: { type: String, default: "in-station", enum: ["in-station", "out-station"] },

    // Contact
    contactPerson: { type: String, default: "" },
    contactNumber: { type: String, default: "" },

    // Goal / outcome
    target:       { type: String, default: "" },
    orderDetails: { type: String, default: "" },
    revisitDate:  { type: String, default: "" },
    notes:        { type: String, default: "" },
    assignedBy:   { type: String, default: "" },

    // Status
    status:       { type: String, default: "pending",  enum: ["pending", "in-progress", "completed", "cancelled", "deferred"] },
    actionStatus: { type: String, default: "progress", enum: ["satisfactory", "successful", "progress", "revisit-required", "order-placed", "order-collected"] },
    priority:     { type: String, default: "medium",   enum: ["low", "medium", "high"] },

    // Activity metrics
    fieldCalls:    { type: Number, default: 0 },
    faceToFace:    { type: Number, default: 0 },
    virtualMeet:   { type: Number, default: 0 },
    productDetail: { type: Number, default: 0 },
    coordination:  { type: Number, default: 0 },
    jointWork:     { type: Number, default: 0 },
    coaching:      { type: Number, default: 0 },
    training:      { type: Number, default: 0 },
  },
  {
    _id: true,
  }
);

// ── Daily target sub-schema 
const dailyTargetSchema = new mongoose.Schema(
  {
    calls:       { type: Number, default: 0 },
    visits:      { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue:     { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Weekly metrics sub-schema 
const weeklyMetricsSchema = new mongoose.Schema(
  {
    achievements:  { type: String, default: "" },
    challenges:    { type: String, default: "" },
    nextWeekPlan:  { type: String, default: "" },
  },
  { _id: false }
);

//  Main plan schema 
const dailyPlanSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "MarketingAgent",
      required: true,
      index: true,
    },

    planType:  { type: String, required: true, enum: ["daily", "weekly", "fortnightly", "monthly", "station", "outstations"] },
    startDate: { type: String, required: true },
    endDate:   { type: String, required: true },

    // Agent meta
    agentName:        { type: String, default: "" },
    agentId:          { type: String, default: "" },
    agentRegion:      { type: String, default: "" },
    reportingManager: { type: String, default: "" },

    tasks:            { type: [taskSchema],        default: [] },
    dailyTarget:      { type: dailyTargetSchema,   default: () => ({}) },
    weeklyMetrics:    { type: weeklyMetricsSchema,  default: () => ({}) },
    endOfDayReport:   { type: String, default: "" },
    superiorNotes:    { type: String, default: "" },
    extraActivities:  { type: [String],            default: [] },
  },
  { timestamps: true }
);

// Compound index so upserts are fast
dailyPlanSchema.index({ agent: 1, planType: 1, startDate: 1, endDate: 1 }, { unique: true });

export default mongoose.model("DailyPlan", dailyPlanSchema);