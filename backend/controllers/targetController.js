// controllers/targetController.js
import mongoose    from "mongoose";
import Target      from "../models/Target.js";
import Product     from "../models/Product.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import AgentPoints from "../models/Agentpoints.js";

async function getAgentTotalEarned(agentId) {
  const result = await AgentPoints.aggregate([
    {
      $match: {
        agentId: new mongoose.Types.ObjectId(agentId),
        points:  { $gt: 0 },
      },
    },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);
  return result[0]?.total ?? 0;
}

async function getProductTargetEarned(agentId, targetId) {
  const result = await AgentPoints.aggregate([
    {
      $match: {
        agentId:     new mongoose.Types.ObjectId(agentId),
        taskKey:     "product_target_sale",
        referenceId: targetId.toString(),
      },
    },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);
  return result[0]?.total ?? 0;
}


// ── Fix 1: awardTargetBonus — atomic bonus award ──────────────────────────
async function awardTargetBonus(agentId, target, achievedValue) {
  // Always update the stored achieved value
  await Target.findByIdAndUpdate(target._id, { achieved: achievedValue });

  if (achievedValue < target.target) return;  // milestone not crossed
  if (target.bonusAwarded) return;            // already done (stale check — fast exit)

  // Atomic: only update if bonusAwarded is still false in DB
  const claimed = await Target.findOneAndUpdate(
    { _id: target._id, bonusAwarded: false }, // ← condition prevents double-credit
    { $set: { bonusAwarded: true } },
    { new: true }
  );
  if (!claimed) return; // another process already awarded it

  // Credit bonus points
  if (target.bonusPoints > 0) {
    await AgentPoints.create({
      agentId,
      taskKey:   "points_target_achieved",
      taskLabel: `Target Achieved: ${target.name}`,
      points:    target.bonusPoints,
      note:      `Bonus for completing "${target.name}"`,
      addedBy:   "system",
    });
    console.log(`[PointsTarget] +${target.bonusPoints} pts → agent ${agentId} for "${target.name}"`);
  }

  // Credit rupee reward (one-time) into salary
  if (target.rupeeReward > 0 && target.rupeeRewardType === "one_time") {
    const rupeeSet = await Target.findOneAndUpdate(
      { _id: target._id, rupeeAwarded: false },
      { $set: { rupeeAwarded: true } },
      { new: true }
    );
    if (rupeeSet) {
      try {
        const AgentSalary = (await import("../models/AgentSalary.js")).default;
        await AgentSalary.findOneAndUpdate(
          { agentId },
          {
            $inc: { balance: target.rupeeReward, totalEarned: target.rupeeReward },
            $push: {
              transactions: {
                type: "credit", amount: target.rupeeReward, source: "points_target",
                note: `₹ reward for target: "${target.name}"`, createdAt: new Date(),
              },
            },
          },
          { upsert: true }
        );
        console.log(`[PointsTarget] ₹${target.rupeeReward} salary reward → agent ${agentId}`);
      } catch (e) {
        console.error("[PointsTarget] rupeeReward credit failed:", e.message);
      }
    }
  }
}

// ── Fix 2: awardPendingBonuses — correct MongoDB query for null/empty ──────
async function awardPendingBonuses(agentId, totalEarned) {
  const pending = await Target.find({
    type:         "points",
    bonusAwarded: false,
    // General targets only — no linked product
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

  for (const t of pending) {
    if (totalEarned >= t.target) {
      await awardTargetBonus(agentId, t, totalEarned);
    }
  }
}

async function injectAchieved(targets, agentId) {
  const agent = await MarketingAgent.findById(agentId);
  if (!agent) return targets.map((t) => (t.toObject ? t.toObject() : { ...t }));

  const hasGeneralPointsTargets = targets.some((t) => {
    const doc = t.toObject ? t.toObject() : t;
    return doc.type === "points" && !doc.linkedProductName;
  });

  let totalEarned = 0;
  if (hasGeneralPointsTargets) {
    totalEarned = await getAgentTotalEarned(agentId);

    awardPendingBonuses(agentId, totalEarned).catch((err) =>
      console.error("[PointsTarget] bonus award error:", err)
    );
  }

  const result = [];
  for (const t of targets) {
    const doc = t.toObject ? t.toObject() : { ...t };

    // ── product target: count billing orders from agent.responses ──────────
    if (doc.type === "product" && doc.product_name) {
  const SaleOrder = (await import("../models/Saleorder.js")).default;
  const nameRegex = new RegExp(`^${doc.product_name}$`, "i");

  const orders = await SaleOrder.find({
    agentId: new mongoose.Types.ObjectId(agentId),
    isVoid:  { $ne: true },
    $or: [
      { "items.productName": nameRegex },
      { "items.brandName":   nameRegex },
    ],
  }).lean();

  doc.achieved = orders.reduce((sum, order) => {
    return sum + order.items
      .filter(i =>
        nameRegex.test(i.productName) ||
        nameRegex.test(i.brandName)
      )
      .reduce((s, i) => s + (i.qty || 1), 0);
  }, 0);
}
    // ── points target (product-linked): recalculate live from SaleOrder ────
if (doc.type === "points" && doc.linkedProductName && doc.linkedProductName.trim() !== "") {
  const SaleOrder = (await import("../models/Saleorder.js")).default;
  const nameRegex = new RegExp(`^${doc.linkedProductName}$`, "i");

  const orders = await SaleOrder.find({
    agentId: new mongoose.Types.ObjectId(agentId),
    isVoid:  { $ne: true },
    $or: [
      { "items.productName": nameRegex },
      { "items.brandName":   nameRegex },
    ],
  }).lean();

  // Sum qty × pointsPerUnit across all matching items
  const totalUnits = orders.reduce((sum, order) => {
    return sum + order.items
      .filter(i => nameRegex.test(i.productName) || nameRegex.test(i.brandName))
      .reduce((s, i) => s + (i.qty || 1), 0);
  }, 0);

  doc.achieved = totalUnits * (doc.pointsPerUnit || 1);

  // Fire bonus award if threshold crossed (non-blocking)
  if (doc.achieved >= doc.target && !doc.bonusAwarded) {
    awardTargetBonus(agentId, doc, doc.achieved).catch((err) =>
      console.error("[PointsTarget] live bonus award error:", err)
    );
  }
}

    // ── points target (general): use total earned points ───────────────────
    if (doc.type === "points" && (!doc.linkedProductName || doc.linkedProductName.trim() === "")) {
  doc.achieved = totalEarned;
}

    result.push(doc);
  }
  return result;
}

// ── ROUTE HANDLERS ────────────────────────────────────────────────────────────

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
      agentId &&
      agentId !== "all" &&
      (type === "product" || type === "points");

    const data = needsInject
      ? await injectAchieved(rows, agentId)
      : rows.map((r) => r.toObject());

    res.json(data);
  } catch (err) {
    console.error("getTargets error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMyTargets = async (req, res) => {
  try {
    const { type } = req.query;
    const agentId  = req.user.id;

    const filter = {
      type,
      $or: [
        { agentId },
        { agentId: { $exists: false } },
        { agentId: null },
      ],
    };

    const rows = await Target.find(filter).sort({ createdAt: -1 });

    const data =
      type === "product" || type === "points"
        ? await injectAchieved(rows, agentId)
        : rows.map((r) => r.toObject());

    res.json(data);
  } catch (err) {
    console.error("getMyTargets error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const createTarget = async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.agentId === "all" || body.agentId === "") {
      delete body.agentId;
    }

    if (body.type === "product" || body.type === "points") {
      delete body.achieved;
    }

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
    const body     = { ...req.body };
    const existing = await Target.findById(req.params.id).lean();

    if (existing?.type === "product" || existing?.type === "points") {
      delete body.achieved;
    }

    // If admin changes the target threshold, reset bonus so it re-evaluates
    if (existing?.type === "points" && body.target) {
      body.bonusAwarded = false;
      body.rupeeAwarded = false;
    }

    const updated = await Target.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );
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
    console.error("deleteTarget error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getOptions = async (req, res) => {
  try {
    const options = await Target.find({ type: "option" });
    const grouped = { segments: [], regions: [], months: [], years: [] };
    options.forEach((opt) => {
      if (grouped[opt.optionKey]) grouped[opt.optionKey].push(opt.value);
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addOption = async (req, res) => {
  try {
    const { key }   = req.params;
    const { value } = req.body;
    const exists    = await Target.findOne({ type: "option", optionKey: key, value });
    if (exists) return res.json(exists);
    const saved = await new Target({ type: "option", optionKey: key, value }).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const triggerPointsSync = async (agentId) => {
  try {
    const totalEarned = await getAgentTotalEarned(agentId);
    await awardPendingBonuses(agentId, totalEarned);
  } catch (err) {
    console.error("[PointsTarget] triggerPointsSync error:", err);
  }
};

export const creditProductSalePoints = async (agentId, items = []) => {
  try {
    for (const item of items) {
      // Resolve the best name — skip "Unknown Product"
      const resolvedName = (
        item.productName && item.productName !== "Unknown Product"
          ? item.productName
          : item.title || item.brandName || ""
      ).trim();

      const brandFallback = (item.brandName || "").trim();
      if (!resolvedName && !brandFallback) continue;

      const nameRegex  = resolvedName  ? new RegExp(`^${resolvedName}$`,  "i") : null;
      const brandRegex = brandFallback ? new RegExp(`^${brandFallback}$`, "i") : null;

      const orClauses = [
        ...(nameRegex  ? [{ linkedProductName: nameRegex  }] : []),
        ...(brandRegex && brandFallback !== resolvedName
              ? [{ linkedProductName: brandRegex }] : []),
      ];

      if (!orClauses.length) continue;

      const linkedTargets = await Target.find({
        type: "points",
        $or: orClauses,
        $and: [{
          $or: [
            { agentId: new mongoose.Types.ObjectId(agentId) },
            { agentId: { $exists: false } },
            { agentId: null },
          ],
        }],
      });

      const displayName = resolvedName || brandFallback;

      for (const target of linkedTargets) {
        const ptsPerUnit  = target.pointsPerUnit || 0;
        const unitsSold   = item.qty || 1;
        const ptsToCredit = ptsPerUnit * unitsSold;

        if (ptsToCredit > 0) {
          await AgentPoints.create({
            agentId,
            taskKey:        "product_target_sale",
            taskLabel:      `Sale: ${displayName} (${unitsSold} unit${unitsSold > 1 ? "s" : ""})`,
            points:         ptsToCredit,
            referenceId:    target._id.toString(),
            referenceModel: "Target",
            note:           `${unitsSold} unit(s) × ${ptsPerUnit} pts — "${target.name}"`,
            addedBy:        "system",
          });
        }

        const newAchieved = await getProductTargetEarned(agentId, target._id);
        await awardTargetBonus(agentId, target, newAchieved);
      }
    }
  } catch (err) {
    console.error("[creditProductSalePoints] error:", err);
  }
};

export const syncPointsTargetsAchieved = async (req, res) => {
  try {
    const SaleOrder = (await import("../models/Saleorder.js")).default;

    // Get all product-linked points targets
    const pointsTargets = await Target.find({
      type: "points",
      linkedProductName: { $exists: true, $ne: "" },
    }).lean();

    console.log(`[Sync] Found ${pointsTargets.length} product-linked points targets`);

    const results = [];

    for (const target of pointsTargets) {
      const nameRegex = new RegExp(`^${target.linkedProductName}$`, "i");

      // Find all matching sale orders for this target's agentId (or all agents if no agentId)
      const agentFilter = target.agentId
        ? { agentId: new mongoose.Types.ObjectId(target.agentId) }
        : {};

      const orders = await SaleOrder.find({
        ...agentFilter,
        isVoid: { $ne: true },
        $or: [
          { "items.productName": nameRegex },
          { "items.brandName":   nameRegex },
        ],
      }).lean();

      console.log(`[Sync] Target "${target.name}" | linkedProduct="${target.linkedProductName}" | orders=${orders.length}`);

      // Log every item found for debug
      orders.forEach(o => {
        o.items.forEach(i => {
          const matches = nameRegex.test(i.productName) || nameRegex.test(i.brandName);
          if (matches) {
            console.log(`  ✓ order=${o._id} productName="${i.productName}" brandName="${i.brandName}" qty=${i.qty}`);
          }
        });
      });

      const totalUnits = orders.reduce((sum, order) => {
        return sum + order.items
          .filter(i => nameRegex.test(i.productName) || nameRegex.test(i.brandName))
          .reduce((s, i) => s + (i.qty || 1), 0);
      }, 0);

      const ppu = target.pointsPerUnit || 0;
      const newAchieved = totalUnits * ppu;

      console.log(`[Sync] totalUnits=${totalUnits} × pointsPerUnit=${ppu} = achieved=${newAchieved}`);

      // Update the target's achieved value directly
      await Target.findByIdAndUpdate(target._id, { achieved: newAchieved });

      // Fire bonus if threshold crossed
      if (newAchieved >= target.target && !target.bonusAwarded && target.agentId) {
        await awardTargetBonus(target.agentId.toString(), target, newAchieved);
        console.log(`[Sync] 🏆 Bonus awarded for "${target.name}"`);
      }

      results.push({
        targetId:          target._id,
        name:              target.name,
        linkedProductName: target.linkedProductName,
        pointsPerUnit:     ppu,
        totalUnits,
        newAchieved,
        target:            target.target,
        bonusAwarded:      target.bonusAwarded,
      });
    }

    res.json({ success: true, synced: results.length, results });
  } catch (err) {
    console.error("[Sync] error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};