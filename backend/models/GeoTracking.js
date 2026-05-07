// models/GeoTracking.js
import mongoose from "mongoose";

const visitLogSchema = new mongoose.Schema({
  time:        { type: String },
  location:    { type: String, required: true },
  lat:         { type: Number },
  lng:         { type: Number },
  activity:    {
    type: String,
    enum: [
      'Doctor Visit', 'Hospital Round', 'Distributor Meet',
      'Retailer Visit', 'Stockist Visit', 'Path Lab Visit',
      'Diagnostic Centre', 'Medical Store', 'Office Meeting',
      'Training', 'Other'
    ],
    default: 'Other'
  },
  doctorName:   { type: String },
  clinicName:   { type: String },
  area:         { type: String },
  verified:     { type: Boolean, default: false },
  verifiedAt:   { type: Date },
  notes:        { type: String },
  imageProof:   { type: String },
  accuracy:     { type: Number },
  altitude:     { type: Number },
  speed:        { type: Number },
}, { timestamps: true });

const geoTrackingSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingAgent',
    required: true,
  },
  date:             { type: String, required: true },
  trackingEnabled:  { type: Boolean, default: true },
  checkInTime:      { type: String },
  checkOutTime:     { type: String },
  totalDistanceKm:  { type: Number, default: 0 },
  timeInFieldMins:  { type: Number, default: 0 },
  visitLogs:        [visitLogSchema],
  routeCoordinates: [{ lat: Number, lng: Number, timestamp: Date }],
}, { timestamps: true });

geoTrackingSchema.index({ agent: 1, date: 1 }, { unique: true });

export default mongoose.model('GeoTracking', geoTrackingSchema);