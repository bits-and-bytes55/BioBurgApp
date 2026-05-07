// controllers/attendanceController.js
import Attendance from "../models/Attendance.js";

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTime  = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

// GET /api/attendance/today  — get or create today's record
export const getToday = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date    = todayStr();
    let record    = await Attendance.findOne({ agent: agentId, date });
    if (!record) {
      // Auto-detect Sunday
      const dayOfWeek = new Date().getDay();
      record = await Attendance.create({
        agent: agentId,
        date,
        status: dayOfWeek === 0 ? "Sunday" : "Absent",
      });
    }
    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/checkin
export const checkIn = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date    = todayStr();
    const { lat, lng } = req.body;

    const existing = await Attendance.findOne({ agent: agentId, date });
    if (existing?.checkInTime) {
      return res.status(400).json({ success: false, message: "Already checked in today" });
    }

    const record = await Attendance.findOneAndUpdate(
      { agent: agentId, date },
      { checkInTime: nowTime(), checkInLat: lat, checkInLng: lng, status: "Present" },
      { new: true, upsert: true }
    );
    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/checkout
export const checkOut = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date    = todayStr();
    const { lat, lng } = req.body;

    const existing = await Attendance.findOne({ agent: agentId, date });
    if (!existing?.checkInTime) {
      return res.status(400).json({ success: false, message: "Please check in first" });
    }
    if (existing?.checkOutTime) {
      return res.status(400).json({ success: false, message: "Already checked out" });
    }

    // Calculate working minutes
    const [inH, inM] = existing.checkInTime.split(":").map(Number);
    const [outH, outM] = nowTime().split(":").map(Number);
    const workingMins = (outH * 60 + outM) - (inH * 60 + inM);

    // Half Day if < 4.5 hours
    const status = workingMins < 270 ? "Half Day" : "Present";

    const record = await Attendance.findOneAndUpdate(
      { agent: agentId, date },
      { checkOutTime: nowTime(), checkOutLat: lat, checkOutLng: lng, workingMins, status },
      { new: true }
    );
    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/month/:year/:month  — full month log
export const getMonthLog = async (req, res) => {
  try {
    const agentId     = req.user.id;
    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month).padStart(2, "0")}-31`;

    const records = await Attendance.find({
      agent: agentId,
      date:  { $gte: from, $lte: to },
    }).sort({ date: 1 });

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/summary/:year/:month  — computed stats
export const getMonthlySummary = async (req, res) => {
  try {
    const agentId     = req.user.id;
    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month).padStart(2, "0")}-31`;

    const records = await Attendance.find({ agent: agentId, date: { $gte: from, $lte: to } });

    const summary = {
      present:    records.filter(r => r.status === "Present").length,
      absent:     records.filter(r => r.status === "Absent").length,
      halfDay:    records.filter(r => r.status === "Half Day").length,
      onLeave:    records.filter(r => r.status === "On Leave").length,
      sundays:    records.filter(r => r.status === "Sunday").length,
      totalMins:  records.reduce((s, r) => s + (r.workingMins || 0), 0),
      totalDays:  records.length,
    };
    summary.attendancePct = summary.totalDays > 0
      ? Math.round((summary.present / (summary.totalDays - summary.sundays)) * 100)
      : 0;
    summary.avgHoursPerDay = summary.present > 0
      ? Math.round(summary.totalMins / summary.present)
      : 0;

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/attendance/:date  — admin/HR correction
export const updateRecord = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date } = req.params;
    const { status, checkInTime, checkOutTime, leaveType, notes } = req.body;

    const record = await Attendance.findOneAndUpdate(
      { agent: agentId, date },
      { status, checkInTime, checkOutTime, leaveType, notes },
      { new: true, upsert: true }
    );
    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/history  — last 90 days
export const getHistory = async (req, res) => {
  try {
    const agentId = req.user.id;
    const from = new Date(); from.setDate(from.getDate() - 90);
    const records = await Attendance.find({
      agent: agentId,
      date: { $gte: from.toISOString().slice(0, 10) },
    }).sort({ date: -1 });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};