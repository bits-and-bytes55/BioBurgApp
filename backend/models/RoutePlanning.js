// models/RoutePlanning.js
import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  order:         { type: Number, required: true },
  placeId:       { type: String },               
  placeName:     { type: String, required: true },
  address:       { type: String },
  lat:           { type: Number },
  lng:           { type: Number },
  activity:      { type: String },
  contactPerson: { type: String },
  contactNumber: { type: String },
  estimatedTime: { type: String },              
  durationMins:  { type: Number, default: 30 },
  status: {
    type: String,
    enum: ['pending', 'visited', 'skipped', 'rescheduled'],
    default: 'pending',
  },
  notes:         { type: String },
  arrivedAt:     { type: String },
  leftAt:        { type: String },
});

const routePlanSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingAgent',
    required: true,
  },
  date:            { type: String, required: true },
  title:           { type: String, default: 'Daily Route' },
  startLocation:   { placeId: String, placeName: String, address: String, lat: Number, lng: Number },
  endLocation:     { placeId: String, placeName: String, address: String, lat: Number, lng: Number },
  stops:           [stopSchema],
  totalDistanceKm: { type: Number, default: 0 },
  totalDurationMins:{ type: Number, default: 0 },
  travelMode:      { type: String, enum: ['driving','walking','transit'], default: 'driving' },
  status:          { type: String, enum: ['draft','active','completed'], default: 'draft' },
  notes:           { type: String },
}, { timestamps: true });

routePlanSchema.index({ agent: 1, date: 1 }, { unique: true });

export default mongoose.model('RoutePlan', routePlanSchema);