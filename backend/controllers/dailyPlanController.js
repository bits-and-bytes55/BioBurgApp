// controllers/dailyPlanController.js
import mongoose from "mongoose";
import DailyPlan from "../models/DailyPlan.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const getAgentId = (req) => req.user?.id || req.user?._id || req.agent?.id;

const normalizeLocType = (v) => {
  if (!v) return "in-station";

  const map = {
    "in-station": "in-station",
    "out-station": "out-station",
    "In-Station": "in-station",
    "Out-Station": "out-station",
    "in station": "in-station",
    "out station": "out-station",
    instation: "in-station",
    outstation: "out-station",
  };

  return map[v] ?? v.toLowerCase().replace(/\s+/, "-");
};

const normalizePlanTasks = (plan) => {
  if (!plan?.tasks) return plan;

  return {
    ...plan,
    tasks: plan.tasks.map(({ _id, ...rest }) => ({
      id: _id.toString(),
      ...rest,
    })),
  };
};

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

  const rawRequestedId = req.query?.agentId || req.body?.agentId;
  const requestedAgentId =
    rawRequestedId && mongoose.Types.ObjectId.isValid(rawRequestedId)
      ? rawRequestedId
      : viewerAgentId;  

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

export const getPlan = async (req, res) => {
  try {
    const { planType, startDate, endDate } = req.params;
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this agent plan",
      });
    }

    const plan = await DailyPlan.findOne({
      agent: targetAgentId,
      planType,
      startDate,
      endDate,
    })
      .populate("agent", "name email phone assignedArea role")
      .lean();

    res.json({
      success: true,
      plan: plan ? normalizePlanTasks(plan) : null,
    });
  } catch (err) {
    console.error("getPlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/daily-plan/:date
export const getDailyPlan = async (req, res) => {
  try {
    const { date } = req.params;
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this agent plan",
      });
    }

    const plan = await DailyPlan.findOne({
      agent: targetAgentId,
      planType: "daily",
      startDate: date,
    })
      .populate("agent", "name email phone assignedArea role")
      .lean();

    res.json({
      success: true,
      plan: plan ? normalizePlanTasks(plan) : null,
    });
  } catch (err) {
    console.error("getDailyPlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/daily-plan/:planType/upsert
export const upsertPlan = async (req, res) => {
  try {
    const { planType } = req.params;
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this agent plan",
      });
    }

    const {
      startDate,
      endDate,
      agentName,
      agentId,
      agentRegion,
      reportingManager,
      dailyTarget,
      weeklyMetrics,
      endOfDayReport,
      superiorNotes,
      extraActivities,
      tasks = [],
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const cleanTasks = tasks.map((task) => {
      const { id, ...rest } = task;

      return {
        ...rest,
        locationType: normalizeLocType(rest.locationType),
        fieldCalls: Number(rest.fieldCalls) || 0,
        faceToFace: Number(rest.faceToFace) || 0,
        virtualMeet: Number(rest.virtualMeet) || 0,
        productDetail: Number(rest.productDetail) || 0,
        coordination: Number(rest.coordination) || 0,
        jointWork: Number(rest.jointWork) || 0,
        coaching: Number(rest.coaching) || 0,
        training: Number(rest.training) || 0,
      };
    });

    const plan = await DailyPlan.findOneAndUpdate(
      {
        agent: targetAgentId,
        planType,
        startDate,
        endDate,
      },
      {
        $set: {
          agentName,
          agentId,
          agentRegion,
          reportingManager,
          dailyTarget,
          weeklyMetrics,
          endOfDayReport,
          superiorNotes,
          extraActivities,
          tasks: cleanTasks,
          planType,
          startDate,
          endDate,
          agent: targetAgentId,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    )
      .populate("agent", "name email phone assignedArea role")
      .lean();

    res.json({
      success: true,
      plan: normalizePlanTasks(plan),
    });
  } catch (err) {
    console.error("upsertPlan error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Concurrent save conflict - please retry.",
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/daily-plan/:planType/:startDate/:endDate
export const deletePlan = async (req, res) => {
  try {
    const { planType, startDate, endDate } = req.params;
    const { targetAgentId, canAccess } = await resolveTargetAgentId(req);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this agent plan",
      });
    }

    const result = await DailyPlan.findOneAndDelete({
      agent: targetAgentId,
      planType,
      startDate,
      endDate,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({ success: true, message: "Plan deleted" });
  } catch (err) {
    console.error("deletePlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
