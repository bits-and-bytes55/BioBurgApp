import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  timeSlot: String,
  activity: String,
  location: String,
  target: String,
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "cancelled"],
    default: "pending"
  },
  notes: String
});

const dailyTargetSchema = new mongoose.Schema({
  calls: Number,
  visits: Number,
  conversions: Number,
  revenue: Number
});

const dailyPlanSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    agentName: String,
    dailyTarget: dailyTargetSchema,
    tasks: [taskSchema]
  },
  { timestamps: true }
);

export default mongoose.model("DailyPlan", dailyPlanSchema);
