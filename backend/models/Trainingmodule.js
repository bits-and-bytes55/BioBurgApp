import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text:         { type: String, required: true },
  options:      [{ type: String, required: true }],
  correctIndex: { type: Number, required: true }
});

const attemptSchema = new mongoose.Schema(
  {
    agent:      { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
    agentName:  String,
    score:      { type: Number, default: 0 },
    total:      { type: Number, default: 0 },
    passed:     { type: Boolean, default: false },
    answers:    [Number],
    timeTaken:  String,
    watchedPct: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const trainingModuleSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    hasVideo:          { type: Boolean, default: false },
    videoUrl:          { type: String, default: "" },
    videoPublicId:     { type: String, default: "" },
    videoResourceType: { type: String, default: "video" },

    hasQuiz:      { type: Boolean, default: false },
    passPercent:  { type: Number, default: 70, min: 1, max: 100 },
    watchPercent: { type: Number, default: 70, min: 0, max: 100 },
    questions:    [questionSchema],
    
    assignmentType: {
      type: String,
      enum: ["all", "specific", "area"],
      default: "all"
    },
    assignedAgents: [{ type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent" }],
    assignedAreas:  [{ type: String }],

    isActive:   { type: Boolean, default: true },
    isVisible:  { type: Boolean, default: true },
    createdBy:  { type: String, default: "admin" },
    attempts:   [attemptSchema]
  },
  { timestamps: true }
);

export default mongoose.model("TrainingModule", trainingModuleSchema);