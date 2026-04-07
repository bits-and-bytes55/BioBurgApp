import mongoose from "mongoose";

const AgentPointsSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      required: true,
    },
    taskKey: { type: String, required: true },
    taskLabel: { type: String, default: "" },
    points: { type: Number, required: true },       
    referenceId: { type: String, default: "" },     
    referenceModel: { type: String, default: "" },   
    note: { type: String, default: "" },
    addedBy: { type: String, default: "system" },    
  },
  { timestamps: true }
);

AgentPointsSchema.index({ agentId: 1, createdAt: -1 });

export default mongoose.model("AgentPoints", AgentPointsSchema);