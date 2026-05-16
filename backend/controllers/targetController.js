import mongoose from "mongoose";
import Target from "../models/Target.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import AgentPoints from "../models/Agentpoints.js";

export const PRODUCT_SALE_TASKKEY = "product_sale";

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

    (currentAgent?.teamMembers || []).forEach((id) => queue.push(id.toString()));
  }

  return [...visibleIds];
};

async function getAgentTaskEarned(agentId) {
  const result = await AgentPoints.aggregate([
    {
      $match: {
        agentId: new mongoose.Types.ObjectId(agentId),
        points: { $gt: 0 },
        taskKey: { $ne: PRODUCT_SALE_TASKKEY },
      },
    },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);

  return result[0]?.total ?? 0;
}

async function getProductTargetPoints(agentId, targetId) {
  const result = await AgentPoints.aggregate([
    {
      $match: {
        agentId: new mongoose.Types.ObjectId(agentId),
        taskKey: PRODUCT_SALE_TASKKEY,
        referenceId: targetId.toString(),
      },
    },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);

  return result[0]?.total ?? 0;
}

async function awardTargetBonus(agentId, targetId, achievedValue) {
  const target = await Target.findById(targetId).lean();
  if (!target) return;
  if (achievedValue < target.target) return;
  if (target.bonusAwarded) return;

  const claimed = await Target.findOneAndUpdate(
    { _id: targetId, bonusAwarded: false },
    { $set: { bonusAwarded: true, achieved: achievedValue } },
    { new: true }
  );

  if (!claimed) return;

  if (target.bonusPoints > 0) {
    await AgentPoints.create({
      agentId,
      taskKey: "points_target_achieved",
      taskLabel: `Target Achieved: ${target.name}`,
      points: target.bonusPoints,
      note: `Bonus for completing "${target.name}"`,
      addedBy: "system",
    });
  }

  if (target.rupeeReward > 0 && target.rupeeRewardType === "one_time") {
    const rupeeSet = await Target.findOneAndUpdate(
      { _id: targetId, rupeeAwarded: false },
      { $set: { rupeeAwarded: true } },
      { new: true }
    );

    if (rupeeSet) {
      try {
        const AgentSalary = (await import("../models/AgentSalary.js")).default;

        await AgentSalary.findOneAndUpdate(
          { agentId },
          {
            $inc: {
              balance: target.rupeeReward,
              totalEarned: target.rupeeReward,
            },
            $push: {
              transactions: {
                type: "credit",
                amount: target.rupeeReward,
                source: "points_target",
                note: `Rs reward for target: "${target.name}"`,
                createdAt: new Date(),
              },
            },
          },
          { upsert: true }
        );
      } catch (e) {
        console.error("[PointsTarget] rupeeReward credit failed:", e.message);
      }
    }
  }
}

async function awardPendingTaskBonuses(agentId, taskEarned) {
  const pending = await Target.find({
    type: "points",
    bonusAwarded: false,
    $and: [
      {
        $or: [
          { linkedProductName: { $exists: false } },
          { linkedProductName: null },
          { linkedProductName: "" },
        ],
      },
      {
        $or: [
          { agentId: new mongoose.Types.ObjectId(agentId) },
          { agentId: { $exists: false } },
          { agentId: null },
        ],
      },
    ],
  });

  for (const target of pending) {
    if (taskEarned >= target.target) {
      await awardTargetBonus(agentId, target._id, taskEarned);
    }
  }
}

async function injectAchieved(targets, agentId) {
  const agent = await MarketingAgent.findById(agentId);
  if (!agent) return targets.map((t) => (t.toObject ? t.toObject() : { ...t }));

  const hasGeneralTargets = targets.some((target) => {
    const doc = target.toObject ? target.toObject() : target;
    return doc.type === "points" && !doc.linkedProductName;
  });

  let taskEarned = 0;

  if (hasGeneralTargets) {
    taskEarned = await getAgentTaskEarned(agentId);
    awardPendingTaskBonuses(agentId, taskEarned).catch((err) =>
      console.error("[PointsTarget] task bonus error:", err)
    );
  }

  let SaleOrder = null;

  const needsSaleOrder = targets.some((target) => {
    const doc = target.toObject ? target.toObject() : target;
    return doc.type === "product";
  });

  if (needsSaleOrder) {
    SaleOrder = (await import("../models/Saleorder.js")).default;
  }

  const result = [];

  for (const target of targets) {
    const doc = target.toObject ? target.toObject() : { ...target };

    if (doc.type === "product" && doc.product_name && SaleOrder) {
      const nameRegex = new RegExp(`^${doc.product_name}$`, "i");

      const orders = await SaleOrder.find({
        agentId: new mongoose.Types.ObjectId(agentId),
        isVoid: { $ne: true },
        $or: [
          { "items.productName": nameRegex },
          { "items.brandName": nameRegex },
        ],
      }).lean();

      doc.achieved = orders.reduce(
        (sum, order) =>
          sum +
          order.items
            .filter(
              (item) =>
                nameRegex.test(item.productName) ||
                nameRegex.test(item.brandName)
            )
            .reduce((s, item) => s + (item.qty || 1), 0),
        0
      );
    }

    if (doc.type === "points" && doc.linkedProductName) {
      const productPts = await getProductTargetPoints(agentId, doc._id);
      doc.achieved = productPts;

      if (productPts >= doc.target && !doc.bonusAwarded) {
        awardTargetBonus(agentId, doc._id, productPts).catch((err) =>
          console.error("[PointsTarget] product bonus error:", err)
        );
      }
    }

    if (doc.type === "points" && !doc.linkedProductName) {
      doc.achieved = taskEarned;
    }

    result.push(doc);
  }

  return result;
}

export const getTargets = async (req, res) => {
  try {
    const { type, agentId } = req.query;
    const filter = {};

    if (type) filter.type = type;

    if (agentId && agentId !== "all") {
      filter.$or = [
        { agentId },
        { agentId: { $exists: false } },
        { agentId: null },
      ];
    }

    const rows = await Target.find(filter).sort({ createdAt: -1 });

    const needsInject =
      agentId && agentId !== "all" && (type === "product" || type === "points");

    const data = needsInject
      ? await injectAchieved(rows, agentId)
      : rows.map((row) => row.toObject());

    res.json(data);
  } catch (err) {
    console.error("getTargets error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMyTargets = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const { type, agentId } = req.query;

    const visibleAgentIds = await getVisibleAgentIds(viewerAgentId);
    const targetAgentId = agentId || viewerAgentId;

    if (!visibleAgentIds.includes(targetAgentId.toString())) {
      return res.status(403).json({ message: "You cannot view this agent targets" });
    }

    const filter = {
      type,
      $or: [
        { agentId: targetAgentId },
        { agentId: { $exists: false } },
        { agentId: null },
      ],
    };

    const rows = await Target.find(filter).sort({ createdAt: -1 });

    const data =
      type === "product" || type === "points"
        ? await injectAchieved(rows, targetAgentId)
        : rows.map((row) => row.toObject());

    res.json(data);
  } catch (err) {
    console.error("getMyTargets error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const createTarget = async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.agentId === "all" || body.agentId === "") delete body.agentId;
    if (body.type === "product" || body.type === "points") delete body.achieved;

    if (body.type === "points") {
      body.bonusAwarded = false;
      body.rupeeAwarded = false;
    }

    const saved = await new Target(body).save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("createTarget error:", err);
    res.status(400).json({ message: err.message });
  }
};

export const updateTarget = async (req, res) => {
  try {
    const body = { ...req.body };
    const existing = await Target.findById(req.params.id).lean();

    if (existing?.type === "product" || existing?.type === "points") {
      delete body.achieved;
    }

    if (existing?.type === "points" && body.target) {
      body.bonusAwarded = false;
      body.rupeeAwarded = false;
    }

    const updated = await Target.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    console.error("updateTarget error:", err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteTarget = async (req, res) => {
  try {
    await Target.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOptions = async (req, res) => {
  try {
    const options = await Target.find({ type: "option" });
    const grouped = { segments: [], regions: [], months: [], years: [] };

    options.forEach((option) => {
      if (grouped[option.optionKey]) grouped[option.optionKey].push(option.value);
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addOption = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const exists = await Target.findOne({
      type: "option",
      optionKey: key,
      value,
    });

    if (exists) return res.json(exists);

    const saved = await new Target({
      type: "option",
      optionKey: key,
      value,
    }).save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const syncPointsTargetsAchieved = async (req, res) => {
  try {
    const agentId = req.body?.agentId || req.query?.agentId;

    if (!agentId) {
      return res.status(400).json({ message: "agentId is required" });
    }

    const taskEarned = await getAgentTaskEarned(agentId);
    await awardPendingTaskBonuses(agentId, taskEarned);

    res.json({ success: true, message: "Points targets synced" });
  } catch (err) {
    console.error("[PointsTarget] syncPointsTargetsAchieved error:", err);
    res.status(500).json({ message: err.message });
  }
};
