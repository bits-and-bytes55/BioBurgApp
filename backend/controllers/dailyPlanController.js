import DailyPlan from "../models/DailyPlan.js";

// helpers
const normalizeLocType = (v) => {
  if (!v) return "in-station";
  const map = {
    "in-station": "in-station", "out-station": "out-station",
    "In-Station":  "in-station", "Out-Station":  "out-station",
    "in station":  "in-station", "out station":  "out-station",
    "instation":   "in-station", "outstation":   "out-station",
  };
  return map[v] ?? v.toLowerCase().replace(/\s+/, "-");
};

export const getPlan = async (req, res) => {
  try {
    const { planType, startDate, endDate } = req.params;

    const plan = await DailyPlan.findOne({
      agent: req.user.id,
      planType,
      startDate,
      endDate,
    }).lean();

    // Expose _id as id on each task so the frontend can track them
    if (plan?.tasks) {
      plan.tasks = plan.tasks.map(({ _id, ...rest }) => ({
        id: _id.toString(),
        ...rest,
      }));
    }

    res.json({ success: true, plan: plan ?? null });
  } catch (err) {
    console.error("getPlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET  /api/daily-plan/:date  (daily shorthand) 
export const getDailyPlan = async (req, res) => {
  try {
    const { date } = req.params;

    const plan = await DailyPlan.findOne({
      agent: req.user.id,
      planType:  "daily",
      startDate: date,
    }).lean();

    if (plan?.tasks) {
      plan.tasks = plan.tasks.map(({ _id, ...rest }) => ({
        id: _id.toString(),
        ...rest,
      }));
    }

    res.json({ success: true, plan: plan ?? null });
  } catch (err) {
    console.error("getDailyPlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/daily-plan/:planType/upsert 
export const upsertPlan = async (req, res) => {
  try {
    const { planType } = req.params;
    const {
      startDate, endDate,
      agentName, agentId, agentRegion, reportingManager,
      dailyTarget, weeklyMetrics, endOfDayReport, superiorNotes,
      extraActivities, tasks = [],
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate are required" });
    }

    // Normalize tasks coming from frontend
    const cleanTasks = tasks.map((t) => {
      // Strip the client-side 'id' field (we use Mongo _id)
      // eslint-disable-next-line no-unused-vars
      const { id, ...rest } = t;
      return {
        ...rest,
        locationType: normalizeLocType(rest.locationType),
        // Numeric fields — guard against NaN
        fieldCalls:    Number(rest.fieldCalls)    || 0,
        faceToFace:    Number(rest.faceToFace)    || 0,
        virtualMeet:   Number(rest.virtualMeet)   || 0,
        productDetail: Number(rest.productDetail) || 0,
        coordination:  Number(rest.coordination)  || 0,
        jointWork:     Number(rest.jointWork)     || 0,
        coaching:      Number(rest.coaching)      || 0,
        training:      Number(rest.training)      || 0,
      };
    });

    const plan = await DailyPlan.findOneAndUpdate(
      { agent: req.user.id, planType, startDate, endDate },
      {
        $set: {
          agentName, agentId, agentRegion, reportingManager,
          dailyTarget, weeklyMetrics, endOfDayReport, superiorNotes,
          extraActivities, tasks: cleanTasks,
          planType, startDate, endDate,
          agent: req.user.id,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    // Return tasks with id field for the frontend
    if (plan?.tasks) {
      plan.tasks = plan.tasks.map(({ _id, ...rest }) => ({
        id: _id.toString(),
        ...rest,
      }));
    }

    res.json({ success: true, plan });
  } catch (err) {
    console.error("upsertPlan error:", err);
    // Duplicate key on race condition — retry as update
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Concurrent save conflict — please retry." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

//  DELETE /api/daily-plan/:planType/:startDate/:endDate 
export const deletePlan = async (req, res) => {
  try {
    const { planType, startDate, endDate } = req.params;

    const result = await DailyPlan.findOneAndDelete({
      agent: req.user.id,
      planType,
      startDate,
      endDate,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    res.json({ success: true, message: "Plan deleted" });
  } catch (err) {
    console.error("deletePlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};