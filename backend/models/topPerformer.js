import mongoose from "mongoose";

const topPerformerSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  agentId: { type: String, required: true },
  designation: String,
  region: String,

  awardType: String,
  period: String,
  month: String,
  quarter: String,
  year: String,

  rank: Number,
  totalSales: Number,
  targetsAchieved: Number,
  conversionRate: Number,
  leadsGenerated: Number,
  placesCovered: Number,

  incentiveEarned: Number,
  pointsEarned: Number,

  remarks: String,
}, { timestamps: true });

export default mongoose.model("TopPerformer", topPerformerSchema);