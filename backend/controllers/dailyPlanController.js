import DailyPlan from "../models/DailyPlan.js";

/**
 * CREATE or UPDATE Daily Plan (date-wise)
 */
export const saveDailyPlan = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date, agentName, dailyTarget, tasks } = req.body;

    let plan = await DailyPlan.findOne({ agent: agentId, date });

    if (plan) {
      plan.agentName = agentName;
      plan.dailyTarget = dailyTarget;
      plan.tasks = tasks;
      await plan.save();
    } else {
      plan = await DailyPlan.create({
        agent: agentId,
        date,
        agentName,
        dailyTarget,
        tasks
      });
    }

    res.status(200).json({
      success: true,
      message: "Daily plan saved successfully",
      plan
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET Daily Plan by Date
 */
export const getDailyPlanByDate = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date } = req.params;

    const plan = await DailyPlan.findOne({ agent: agentId, date });

    res.status(200).json({
      success: true,
      plan
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET All Plans (History)
 */
export const getAllDailyPlans = async (req, res) => {
  try {
    const agentId = req.user.id;

    const plans = await DailyPlan.find({ agent: agentId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* UPDATE Daily Plan by Date */
export const updateDailyPlan = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date } = req.params;

    const { agentName, dailyTarget, tasks } = req.body;

    const plan = await DailyPlan.findOneAndUpdate(
      { agent: agentId, date },
      {
        agentName,
        dailyTarget,
        tasks
      },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Daily plan not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Daily plan updated successfully",
      plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
/* DELETE Daily Plan by Date */
export const deleteDailyPlan = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date } = req.params;

    const plan = await DailyPlan.findOneAndDelete({
      agent: agentId,
      date
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Daily plan not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Daily plan deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
