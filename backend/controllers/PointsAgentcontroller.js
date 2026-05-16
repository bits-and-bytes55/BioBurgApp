// controllers/pointsAgentController.js
import mongoose from "mongoose";
import AgentPoints from "../models/Agentpoints.js";
import PayoutRequest from "../models/Payoutrequest.js";
import SalaryTransaction from "../models/salaryTransaction.js";
import AgentBankDetails from "../models/agentBankDetails.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const POINTS_TO_RUPEE_RATE = 1;

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

export const getAgentSummary = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const agents = await MarketingAgent.find({
      _id: { $in: visibleAgentIds },
    })
      .select("_id name phone assignedArea role")
      .lean();

    const history = await AgentPoints.find({
      agentId: { $in: visibleAgentIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const agentMap = new Map(
      agents.map((agent) => [
        agent._id.toString(),
        {
          agentId: agent._id,
          agentName: agent.name,
          agentPhone: agent.phone,
          agentArea: agent.assignedArea,
          agentRole: agent.role,
        },
      ])
    );

    const historyWithAgent = history.map((entry) => ({
      ...entry,
      ...(agentMap.get(entry.agentId?.toString()) || {}),
    }));

    const totalEarned = history
      .filter((h) => h.points > 0)
      .reduce((s, h) => s + h.points, 0);

    const totalRedeemed = history
      .filter((h) => h.points < 0)
      .reduce((s, h) => s + Math.abs(h.points), 0);

    const balance = totalEarned - totalRedeemed;

    const agentSummaries = agents.map((agent) => {
      const agentHistory = history.filter(
        (h) => h.agentId?.toString() === agent._id.toString()
      );

      const earned = agentHistory
        .filter((h) => h.points > 0)
        .reduce((s, h) => s + h.points, 0);

      const redeemed = agentHistory
        .filter((h) => h.points < 0)
        .reduce((s, h) => s + Math.abs(h.points), 0);

      return {
        agentId: agent._id,
        agentName: agent.name,
        agentPhone: agent.phone,
        agentArea: agent.assignedArea,
        agentRole: agent.role,
        totalEarned: earned,
        totalRedeemed: redeemed,
        balance: earned - redeemed,
        amountEquivalent: (earned - redeemed) * POINTS_TO_RUPEE_RATE,
      };
    });

    return res.json({
      success: true,
      data: {
        totalEarned,
        totalRedeemed,
        balance,
        amountEquivalent: balance * POINTS_TO_RUPEE_RATE,
        conversionRate: POINTS_TO_RUPEE_RATE,
        history: historyWithAgent,
        agentSummaries,
      },
    });
  } catch (err) {
    console.error("[getAgentSummary]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAgentPayouts = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const agents = await MarketingAgent.find({
      _id: { $in: visibleAgentIds },
    })
      .select("_id name phone assignedArea role")
      .lean();

    const agentMap = new Map(
      agents.map((agent) => [
        agent._id.toString(),
        {
          agentName: agent.name,
          agentPhone: agent.phone,
          agentArea: agent.assignedArea,
          agentRole: agent.role,
        },
      ])
    );

    const payouts = await PayoutRequest.find({
      agentId: { $in: visibleAgentIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const data = payouts.map((payout) => ({
      ...payout,
      ...(agentMap.get(payout.agentId?.toString()) || {}),
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getAgentPayouts]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const redeemPoints = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const SalaryWallet = (await import("../models/salaryWallet.js")).default;

    let { pointsToRedeem, salaryToRedeem, bankDetails } = req.body;

    if (!bankDetails?.accountNumber && !bankDetails?.upiId) {
      const saved = await AgentBankDetails.findOne({ agentId }).lean();

      if (saved) {
        bankDetails = {
          accountHolder: saved.accountHolder,
          accountNumber: saved.accountNumber,
          ifsc: saved.ifsc,
          bankName: saved.bankName,
          upiId: saved.upiId,
        };
      }
    }

    const pts = Number(pointsToRedeem || 0);
    const salAmt = Number(salaryToRedeem || 0);

    if (pts <= 0 && salAmt <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter an amount to redeem",
      });
    }

    if (pts > 0) {
      const allPoints = await AgentPoints.find({ agentId }).lean();
      const balance = allPoints.reduce((s, h) => s + h.points, 0);

      if (pts > balance) {
        return res.status(400).json({
          success: false,
          message: "Insufficient points balance",
        });
      }
    }

    if (salAmt > 0) {
      const wallet = await SalaryWallet.findOne({ agent: agentId }).lean();
      const salBal = wallet?.balance ?? 0;

      if (salAmt > salBal) {
        return res.status(400).json({
          success: false,
          message: "Insufficient salary balance",
        });
      }
    }

    const pending = await PayoutRequest.findOne({
      agentId,
      status: "pending",
    });

    if (pending) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending payout request. Wait for it to be processed.",
      });
    }

    if (!bankDetails?.accountNumber && !bankDetails?.upiId) {
      return res.status(400).json({
        success: false,
        message: "Provide bank account details or UPI ID",
      });
    }

    const pointsAmount = pts * POINTS_TO_RUPEE_RATE;
    const totalAmount = pointsAmount + salAmt;

    const payout = await PayoutRequest.create({
      agentId,
      agentName: req.user?.name || "",
      agentPhone: req.user?.phone || "",
      pointsRedeemed: pts,
      salaryAmount: salAmt,
      amountRequested: totalAmount,
      bankDetails,
    });

    if (pts > 0) {
      await AgentPoints.create({
        agentId,
        taskKey: "payout_request",
        taskLabel: "Payout Request",
        points: -pts,
        referenceId: payout._id.toString(),
        referenceModel: "PayoutRequest",
        note: `Payout request - ${pts} pts (Rs ${pointsAmount})`,
        addedBy: "system",
      });
    }

    if (salAmt > 0) {
      await SalaryWallet.findOneAndUpdate(
        { agent: agentId },
        { $inc: { balance: -salAmt, totalPaidOut: salAmt } },
        { upsert: true }
      );

      await SalaryTransaction.create({
        agent: agentId,
        amount: salAmt,
        type: "debit",
        source: "payout",
        note: `Payout request Rs ${salAmt}`,
      });
    }

    return res.status(201).json({ success: true, data: payout });
  } catch (err) {
    console.error("[redeemPoints]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
