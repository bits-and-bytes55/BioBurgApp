// models/Target.js
import mongoose from "mongoose";

const targetSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["product", "area", "monthly", "option", "points"],
    required: true,
  },

  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent" },

  product_name: String,
  productId:    { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  genericName:  String,
  mrp:          Number,
  segment:      String,

  area_name: String,
  region:    String,

  month_name: String,
  year:       String,

  target:   { type: Number, default: 0 },
  achieved: { type: Number, default: 0 },

  name:         String,
  description:  String,
  bonusPoints:  { type: Number, default: 0 },
  deadline:     Date,
  bonusAwarded: { type: Boolean, default: false },

  linkedProductName: String,       
  linkedProductId:   { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  linkedProductMrp:  String,
  pointsPerUnit:     { type: Number, default: 0 }, 
  rupeeReward:       { type: Number, default: 0 },  
  rupeeRewardType: {
    type: String,
    enum: ["one_time", "per_unit_over"],
    default: "one_time",
  },
  rupeeAwarded: { type: Boolean, default: false }, 
  optionKey: String,
  value:     String,

}, { timestamps: true });

targetSchema.index({ type: 1, agentId: 1 });
targetSchema.index({ type: 1, agentId: 1, bonusAwarded: 1 });
targetSchema.index({ type: 1, linkedProductName: 1 });

export default mongoose.model("Target", targetSchema);