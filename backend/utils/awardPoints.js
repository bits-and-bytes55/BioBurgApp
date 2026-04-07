// utils/awardPoints.js
import AgentPoints from "../models/Agentpoints.js";
import PointsConfig from "../models/Pointsconfig.js";

/**
 * Award points to an agent based on a configured task key.
 * Safe to call without await in non-critical paths.
 *
 * @param {string|ObjectId} agentId
 * @param {string}          taskKey       
 * @param {string}          [referenceId]  
 * @param {string}          [referenceModel]
 * @param {string}          [note]
 * @returns {Promise<AgentPoints|null>}
 */
export async function awardPoints(
  agentId,
  taskKey,
  referenceId = "",
  referenceModel = "",
  note = ""
) {
  try {
    const config = await PointsConfig.findOne({ taskKey, isActive: true });
    if (!config || config.points <= 0) return null;

    const entry = await AgentPoints.create({
      agentId,
      taskKey,
      taskLabel: config.taskLabel,
      points: config.points,
      referenceId: referenceId?.toString() || "",
      referenceModel,
      note: note || `Earned for: ${config.taskLabel}`,
      addedBy: "system",
    });

    return entry;
  } catch (err) {
    console.error("[awardPoints] error:", err.message);
    return null;
  }
}

/**
 * Get the current points balance for an agent.
 * @param {string|ObjectId} agentId
 * @returns {Promise<number>}
 */
export async function getAgentBalance(agentId) {
  try {
    const result = await AgentPoints.aggregate([
      { $match: { agentId: new (await import("mongoose")).default.Types.ObjectId(agentId) } },
      { $group: { _id: null, total: { $sum: "$points" } } },
    ]);
    return result[0]?.total ?? 0;
  } catch {
    return 0;
  }
}