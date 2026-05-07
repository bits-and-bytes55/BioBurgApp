// controllers/geoTrackingController.js
import GeoTracking from "../models/GeoTracking.js";

// Helper: today string
const todayStr = () => new Date().toISOString().slice(0, 10);

// Haversine distance (km) between two lat/lng points
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// GET /api/geo-tracking/:date  — fetch or create today's record
export const getTracking = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date = req.params.date || todayStr();
    let record = await GeoTracking.findOne({ agent: agentId, date });
    if (!record) {
      record = await GeoTracking.create({ agent: agentId, date, visitLogs: [], routeCoordinates: [] });
    }
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/geo-tracking/:date/toggle  — enable/disable tracking
export const toggleTracking = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date = req.params.date || todayStr();
    const { trackingEnabled } = req.body;
    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { trackingEnabled },
      { new: true, upsert: true }
    );
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/checkin
export const checkIn = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date = req.params.date || todayStr();
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { checkInTime: now },
      { new: true, upsert: true }
    );
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/checkout
export const checkOut = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date = req.params.date || todayStr();
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { checkOutTime: now },
      { new: true, upsert: true }
    );
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/visit  — add a visit log entry
export const addVisit = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date = req.params.date || todayStr();
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const visitData = { ...req.body, time: req.body.time || now, verified: false };
    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { $push: { visitLogs: visitData } },
      { new: true, upsert: true }
    );
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/geo-tracking/:date/visit/:visitId/verify  — verify a visit
export const verifyVisit = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date, visitId } = req.params;
    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date, 'visitLogs._id': visitId },
      { $set: { 'visitLogs.$.verified': true, 'visitLogs.$.verifiedAt': new Date() } },
      { new: true }
    );
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/geo-tracking/:date/visit/:visitId
export const deleteVisit = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date, visitId } = req.params;
    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { $pull: { visitLogs: { _id: visitId } } },
      { new: true }
    );
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/location  — push GPS coordinate
export const pushLocation = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date = req.params.date || todayStr();
    const { lat, lng } = req.body;
    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { $push: { routeCoordinates: { lat, lng, timestamp: new Date() } } },
      { new: true, upsert: true }
    );
    // Recalculate distance
    const coords = record.routeCoordinates;
    let dist = 0;
    for (let i = 1; i < coords.length; i++) {
      dist += haversine(coords[i-1].lat, coords[i-1].lng, coords[i].lat, coords[i].lng);
    }
    record.totalDistanceKm = parseFloat(dist.toFixed(2));
    await record.save();
    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/geo-tracking/history?from=&to=  — range history
export const getHistory = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { from, to } = req.query;
    const query = { agent: agentId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to)   query.date.$lte = to;
    }
    const records = await GeoTracking.find(query).sort({ date: -1 }).limit(30);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};