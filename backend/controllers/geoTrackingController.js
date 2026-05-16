// controllers/geoTrackingController.js
import mongoose from "mongoose";
import GeoTracking from "../models/GeoTracking.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const todayStr = () => new Date().toISOString().slice(0, 10);
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

const resolveTargetAgentId = async (req, allowQueryAgent = true) => {
  const viewerAgentId = getAgentId(req);
  const requestedAgentId = allowQueryAgent
  ? req.query?.agentId || req.body?.agentId
  : null;

  const targetAgentId = requestedAgentId || viewerAgentId;
  const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

  const canAccess = visibleAgentIds.some(
    (id) => id.toString() === targetAgentId.toString()
  );

  return {
    viewerAgentId,
    targetAgentId: new mongoose.Types.ObjectId(targetAgentId),
    visibleAgentIds,
    canAccess,
  };
};

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

// GET /api/geo-tracking/:date
export const getTracking = async (req, res) => {
  try {
    const { viewerAgentId, targetAgentId, canAccess } =
      await resolveTargetAgentId(req);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this agent tracking",
      });
    }

    const date = req.params.date || todayStr();

    let record = await GeoTracking.findOne({
      agent: targetAgentId,
      date,
    })
      .populate("agent", "name email phone assignedArea role")
      .lean();

    if (!record && targetAgentId.toString() === viewerAgentId.toString()) {
      const created = await GeoTracking.create({
        agent: targetAgentId,
        date,
        visitLogs: [],
        routeCoordinates: [],
      });

      record = await GeoTracking.findById(created._id)
        .populate("agent", "name email phone assignedArea role")
        .lean();
    }

    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/geo-tracking/:date/toggle
export const toggleTracking = async (req, res) => {
  try {
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);
    const date = req.params.date || todayStr();
    const { trackingEnabled } = req.body;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this agent tracking",
      });
    }

    const record = await GeoTracking.findOneAndUpdate(
      { agent: targetAgentId, date },
      { trackingEnabled },
      { new: true, upsert: true }
    ).populate("agent", "name email phone assignedArea role");

    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/checkin
export const checkIn = async (req, res) => {
  try {
    const agentId = new mongoose.Types.ObjectId(getAgentId(req));
    const date = req.params.date || todayStr();
    const now = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { checkInTime: now },
      { new: true, upsert: true }
    ).populate("agent", "name email phone assignedArea role");

    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/checkout
export const checkOut = async (req, res) => {
  try {
    const agentId = new mongoose.Types.ObjectId(getAgentId(req));
    const date = req.params.date || todayStr();
    const now = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      { checkOutTime: now },
      { new: true, upsert: true }
    ).populate("agent", "name email phone assignedArea role");

    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/visit
export const addVisit = async (req, res) => {
  try {
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);
    const date = req.params.date || todayStr();

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this agent tracking",
      });
    }

    const now = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const visitData = {
      ...req.body,
      agentId: undefined,
      time: req.body.time || now,
      verified: false,
    };

    const record = await GeoTracking.findOneAndUpdate(
      { agent: targetAgentId, date },
      { $push: { visitLogs: visitData } },
      { new: true, upsert: true }
    ).populate("agent", "name email phone assignedArea role");

    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/geo-tracking/:date/visit/:visitId/verify
export const verifyVisit = async (req, res) => {
  try {
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);
    const { date, visitId } = req.params;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot verify this agent visit",
      });
    }

    const record = await GeoTracking.findOneAndUpdate(
      {
        agent: targetAgentId,
        date,
        "visitLogs._id": visitId,
      },
      {
        $set: {
          "visitLogs.$.verified": true,
          "visitLogs.$.verifiedAt": new Date(),
          "visitLogs.$.verifiedBy": getAgentId(req),
        },
      },
      { new: true }
    ).populate("agent", "name email phone assignedArea role");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Visit not found",
      });
    }

    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/geo-tracking/:date/visit/:visitId
export const deleteVisit = async (req, res) => {
  try {
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);
    const { date, visitId } = req.params;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this agent tracking",
      });
    }

    const record = await GeoTracking.findOneAndUpdate(
      { agent: targetAgentId, date },
      { $pull: { visitLogs: { _id: visitId } } },
      { new: true }
    ).populate("agent", "name email phone assignedArea role");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Tracking record not found",
      });
    }

    res.json({ success: true, tracking: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/geo-tracking/:date/location
export const pushLocation = async (req, res) => {
  try {
    const agentId = new mongoose.Types.ObjectId(getAgentId(req));
    const date = req.params.date || todayStr();
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    const record = await GeoTracking.findOneAndUpdate(
      { agent: agentId, date },
      {
        $push: {
          routeCoordinates: {
            lat,
            lng,
            timestamp: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    const coords = record.routeCoordinates || [];
    let dist = 0;

    for (let i = 1; i < coords.length; i++) {
      dist += haversine(
        coords[i - 1].lat,
        coords[i - 1].lng,
        coords[i].lat,
        coords[i].lng
      );
    }

    record.totalDistanceKm = parseFloat(dist.toFixed(2));
    await record.save();

    const populated = await GeoTracking.findById(record._id).populate(
      "agent",
      "name email phone assignedArea role"
    );

    res.json({ success: true, tracking: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/geo-tracking/history?from=&to=&agentId=
export const getHistory = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { from, to, agentId } = req.query;

    const query = {
      agent: { $in: visibleAgentIds },
    };

    if (agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(agentId);
      const canViewRequested = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canViewRequested) {
        return res.status(403).json({
          success: false,
          message: "You cannot view this agent history",
        });
      }

      query.agent = requestedAgentId;
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const records = await GeoTracking.find(query)
      .populate("agent", "name email phone assignedArea role")
      .sort({ date: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
