// controllers/routePlanningController.js
import RoutePlan from "../models/RoutePlanning.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

// GET /api/route-planning/:date
export const getRoute = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date = req.params.date || todayStr();
    let record = await RoutePlan.findOne({ agent: agentId, date });
    if (!record) {
      record = await RoutePlan.create({ agent: agentId, date, stops: [] });
    }
    res.json({ success: true, route: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/route-planning/upsert  — save full plan
export const upsertRoute = async (req, res) => {
  try {
    const agentId = req.user.id;

    const {
      date,
      title,
      startLocation,
      endLocation,
      stops,
      totalDistanceKm,
      totalDurationMins,
      travelMode,
      status,
      notes,
    } = req.body;

    const record = await RoutePlan.findOneAndUpdate(
      {
        agent: agentId,
        date: date || todayStr(),
      },
      {
        $set: {
          agent: agentId,
          date: date || todayStr(),
          title,
          startLocation,
          endLocation,
          stops,
          totalDistanceKm,
          totalDurationMins,
          travelMode,
          status,
          notes,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      route: record,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// PATCH /api/route-planning/:date/stop/:stopId/status
export const updateStopStatus = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date, stopId } = req.params;
    const { status, arrivedAt, leftAt, notes } = req.body;
    const record = await RoutePlan.findOneAndUpdate(
      { agent: agentId, date, 'stops._id': stopId },
      { $set: { 'stops.$.status': status, 'stops.$.arrivedAt': arrivedAt, 'stops.$.leftAt': leftAt, 'stops.$.notes': notes } },
      { new: true }
    );
    res.json({ success: true, route: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/route-planning/:date/stop/:stopId
export const deleteStop = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date, stopId } = req.params;
    const record = await RoutePlan.findOneAndUpdate(
      { agent: agentId, date },
      { $pull: { stops: { _id: stopId } } },
      { new: true }
    );
    res.json({ success: true, route: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/route-planning/history
export const getHistory = async (req, res) => {
  try {
    const agentId = req.user.id;
    const records = await RoutePlan.find({ agent: agentId }).sort({ date: -1 }).limit(20);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};