// models/Attendance.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MarketingAgent",
    required: true,
  },
  date:         { type: String, required: true }, 
  checkInTime:  { type: String },                  
  checkOutTime: { type: String },
  checkInLat:   { type: Number },
  checkInLng:   { type: Number },
  checkOutLat:  { type: Number },
  checkOutLng:  { type: Number },
  workingMins:  { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Present", "Absent", "Half Day", "Sunday", "Holiday", "On Leave"],
    default: "Present",
  },
  leaveType: {
    type: String,
    enum: ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave", ""],
    default: "",
  },
  notes: { type: String },
}, { timestamps: true });

attendanceSchema.index({ agent: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);