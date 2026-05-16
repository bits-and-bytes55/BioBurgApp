// controllers/routePlanningController.js
import mongoose from "mongoose";
import RoutePlan from "../models/RoutePlanning.js";
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

// GET /api/route-planning/:date
export const getRoute = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const { agentId } = req.query;
    const date = req.params.date || todayStr();

    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const selectedAgentId = agentId
      ? new mongoose.Types.ObjectId(agentId)
      : new mongoose.Types.ObjectId(viewerAgentId);

    const canViewSelected = visibleAgentIds.some(
      (id) => id.toString() === selectedAgentId.toString()
    );

    if (!canViewSelected) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this agent route",
      });
    }

    let record = await RoutePlan.findOne({
      agent: selectedAgentId,
      date,
    })
      .populate("agent", "name email phone assignedArea role")
      .lean();

    if (!record && selectedAgentId.toString() === viewerAgentId.toString()) {
      record = await RoutePlan.create({
        agent: selectedAgentId,
        date,
        stops: [],
      });

      record = await RoutePlan.findById(record._id)
        .populate("agent", "name email phone assignedArea role")
        .lean();
    }

    res.json({ success: true, route: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/route-planning/upsert
export const upsertRoute = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);

    const {
      agentId,
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

    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const targetAgentId = agentId
      ? new mongoose.Types.ObjectId(agentId)
      : new mongoose.Types.ObjectId(viewerAgentId);

    const canEditTarget = visibleAgentIds.some(
      (id) => id.toString() === targetAgentId.toString()
    );

    if (!canEditTarget) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this agent route",
      });
    }

    const record = await RoutePlan.findOneAndUpdate(
      {
        agent: targetAgentId,
        date: date || todayStr(),
      },
      {
        $set: {
          agent: targetAgentId,
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
    ).populate("agent", "name email phone assignedArea role");

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
    const viewerAgentId = getAgentId(req);
    const { date, stopId } = req.params;
    const { agentId, status, arrivedAt, leftAt, notes } = req.body;

    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const targetAgentId = agentId
      ? new mongoose.Types.ObjectId(agentId)
      : new mongoose.Types.ObjectId(viewerAgentId);

    const canEditTarget = visibleAgentIds.some(
      (id) => id.toString() === targetAgentId.toString()
    );

    if (!canEditTarget) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this agent route",
      });
    }

    const record = await RoutePlan.findOneAndUpdate(
      {
        agent: targetAgentId,
        date,
        "stops._id": stopId,
      },
      {
        $set: {
          "stops.$.status": status,
          "stops.$.arrivedAt": arrivedAt,
          "stops.$.leftAt": leftAt,
          "stops.$.notes": notes,
        },
      },
      { new: true }
    ).populate("agent", "name email phone assignedArea role");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Route stop not found",
      });
    }

    res.json({ success: true, route: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/route-planning/:date/stop/:stopId
export const deleteStop = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const { date, stopId } = req.params;
    const { agentId } = req.query;

    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const targetAgentId = agentId
      ? new mongoose.Types.ObjectId(agentId)
      : new mongoose.Types.ObjectId(viewerAgentId);

    const canEditTarget = visibleAgentIds.some(
      (id) => id.toString() === targetAgentId.toString()
    );

    if (!canEditTarget) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this agent route",
      });
    }

    const record = await RoutePlan.findOneAndUpdate(
      {
        agent: targetAgentId,
        date,
      },
      {
        $pull: {
          stops: { _id: stopId },
        },
      },
      { new: true }
    ).populate("agent", "name email phone assignedArea role");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({ success: true, route: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/route-planning/history
export const getHistory = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const records = await RoutePlan.find({
      agent: { $in: visibleAgentIds },
    })
      .populate("agent", "name email phone assignedArea role")
      .sort({ date: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
