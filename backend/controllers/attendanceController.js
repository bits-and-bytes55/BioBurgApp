// controllers/attendanceController.js
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const getAgentId = (req) => req.user?.id || req.user?._id || req.agent?.id;

const getVisibleAgentIds = async (agentId) => {
  const rootId = agentId.toString();

  const rootAgent = await MarketingAgent.findById(rootId)
  .select("teamMembers role permissions")
  .lean();

if (!rootAgent) return [rootId];

if (rootAgent.permissions?.allAgentsAccess) {
  const allAgents = await MarketingAgent.find().select("_id").lean();
  return allAgents.map((a) => a._id.toString());
}


  const visibleIds = new Set([rootId]);
  const queue = [...(rootAgent.teamMembers || []).map((id) => id.toString())];

  const directReports = await MarketingAgent.find({ reportsTo: rootId })
    .select("_id")
    .lean();

  directReports.forEach((agent) => {
    if (agent._id) queue.push(agent._id.toString());
  });

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visibleIds.has(currentId)) continue;

    visibleIds.add(currentId);

    const children = await MarketingAgent.find({ reportsTo: currentId })
      .select("_id teamMembers")
      .lean();

    children.forEach((child) => {
      if (child._id) queue.push(child._id.toString());
    });

    const currentAgent = await MarketingAgent.findById(currentId)
      .select("teamMembers")
      .lean();

    (currentAgent?.teamMembers || []).forEach((id) => {
      queue.push(id.toString());
    });
  }

  return [...visibleIds];
};

const getVisibleAgentObjectIds = async (agentId) => {
  const ids = await getVisibleAgentIds(agentId);
  return ids.map((id) => new mongoose.Types.ObjectId(id));
};

const resolveTargetAgentId = async (req) => {
  const viewerAgentId = getAgentId(req);
  const requestedAgentId = req.query.agentId || req.body.agentId || viewerAgentId;
  const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

  const canAccess = visibleAgentIds.some(
    (id) => id.toString() === requestedAgentId.toString()
  );

  return {
    viewerAgentId,
    targetAgentId: new mongoose.Types.ObjectId(requestedAgentId),
    visibleAgentIds,
    canAccess,
  };
};

// GET /api/attendance/today
export const getToday = async (req, res) => {
  try {
    const { viewerAgentId, targetAgentId, canAccess } = await resolveTargetAgentId(req);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this agent attendance",
      });
    }

    const date = todayStr();

    let record = await Attendance.findOne({
      agent: targetAgentId,
      date,
    })
      .populate("agent", "name email phone assignedArea role")
      .lean();

    if (!record && targetAgentId.toString() === viewerAgentId.toString()) {
      const dayOfWeek = new Date().getDay();

      const created = await Attendance.create({
        agent: targetAgentId,
        date,
        status: dayOfWeek === 0 ? "Sunday" : "Absent",
      });

      record = await Attendance.findById(created._id)
        .populate("agent", "name email phone assignedArea role")
        .lean();
    }

    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/checkin
export const checkIn = async (req, res) => {
  try {
    const agentId = new mongoose.Types.ObjectId(getAgentId(req));
    const date = todayStr();
    const { lat, lng } = req.body;

    const existing = await Attendance.findOne({ agent: agentId, date });

    if (existing?.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Already checked in today",
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { agent: agentId, date },
      {
        checkInTime: nowTime(),
        checkInLat: lat,
        checkInLng: lng,
        status: "Present",
      },
      { new: true, upsert: true }
    ).populate("agent", "name email phone assignedArea role");

    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/checkout
export const checkOut = async (req, res) => {
  try {
    const agentId = new mongoose.Types.ObjectId(getAgentId(req));
    const date = todayStr();
    const { lat, lng } = req.body;

    const existing = await Attendance.findOne({ agent: agentId, date });

    if (!existing?.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Please check in first",
      });
    }

    if (existing?.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Already checked out",
      });
    }

    const [inH, inM] = existing.checkInTime.split(":").map(Number);
    const [outH, outM] = nowTime().split(":").map(Number);
    const workingMins = outH * 60 + outM - (inH * 60 + inM);
    const status = workingMins < 270 ? "Half Day" : "Present";

    const record = await Attendance.findOneAndUpdate(
      { agent: agentId, date },
      {
        checkOutTime: nowTime(),
        checkOutLat: lat,
        checkOutLng: lng,
        workingMins,
        status,
      },
      { new: true }
    ).populate("agent", "name email phone assignedArea role");

    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/month/:year/:month
export const getMonthLog = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { agentId } = req.query;
    const { year, month } = req.params;

    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-31`;

    const query = {
      agent: { $in: visibleAgentIds },
      date: { $gte: from, $lte: to },
    };

    if (agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(agentId);
      const canView = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You cannot view this agent attendance",
        });
      }

      query.agent = requestedAgentId;
    }

    const records = await Attendance.find(query)
      .populate("agent", "name email phone assignedArea role")
      .sort({ date: 1 })
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/summary/:year/:month
export const getMonthlySummary = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { agentId } = req.query;
    const { year, month } = req.params;

    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-31`;

    const query = {
      agent: { $in: visibleAgentIds },
      date: { $gte: from, $lte: to },
    };

    if (agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(agentId);
      const canView = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You cannot view this agent attendance",
        });
      }

      query.agent = requestedAgentId;
    }

    const records = await Attendance.find(query)
      .populate("agent", "name email phone assignedArea role")
      .lean();

    const summary = {
      present: records.filter((r) => r.status === "Present").length,
      absent: records.filter((r) => r.status === "Absent").length,
      halfDay: records.filter((r) => r.status === "Half Day").length,
      onLeave: records.filter((r) => r.status === "On Leave").length,
      sundays: records.filter((r) => r.status === "Sunday").length,
      totalMins: records.reduce((s, r) => s + (r.workingMins || 0), 0),
      totalDays: records.length,
    };

    const workingDays = Math.max(0, summary.totalDays - summary.sundays);

    summary.attendancePct =
      workingDays > 0 ? Math.round((summary.present / workingDays) * 100) : 0;

    summary.avgHoursPerDay =
      summary.present > 0 ? Math.round(summary.totalMins / summary.present) : 0;

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/attendance/:date
export const updateRecord = async (req, res) => {
  try {
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);
    const { date } = req.params;
    const { status, checkInTime, checkOutTime, leaveType, notes } = req.body;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this agent attendance",
      });
    }

    const record = await Attendance.findOneAndUpdate(
      {
        agent: targetAgentId,
        date,
      },
      {
        status,
        checkInTime,
        checkOutTime,
        leaveType,
        notes,
      },
      { new: true, upsert: true }
    ).populate("agent", "name email phone assignedArea role");

    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/history
export const getHistory = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { agentId } = req.query;

    const from = new Date();
    from.setDate(from.getDate() - 90);

    const query = {
      agent: { $in: visibleAgentIds },
      date: { $gte: from.toISOString().slice(0, 10) },
    };

    if (agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(agentId);
      const canView = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You cannot view this agent attendance",
        });
      }

      query.agent = requestedAgentId;
    }

    const records = await Attendance.find(query)
      .populate("agent", "name email phone assignedArea role")
      .sort({ date: -1 })
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
