// controllers/salaryController.js
import mongoose from "mongoose";
import SalaryWallet from "../models/salaryWallet.js";
import SalaryTransaction from "../models/salaryTransaction.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

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

// Agent/team summary
export const getAgentSalarySummary = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { agentId } = req.query;

    let targetAgentIds = visibleAgentIds;

    if (agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(agentId);
      const canView = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You cannot view this agent salary",
        });
      }

      targetAgentIds = [requestedAgentId];
    }

    for (const id of targetAgentIds) {
      const exists = await SalaryWallet.findOne({ agent: id }).lean();

      if (!exists) {
        await SalaryWallet.create({ agent: id });
      }
    }

    const [wallets, history] = await Promise.all([
      SalaryWallet.find({ agent: { $in: targetAgentIds } })
        .populate("agent", "name phone email assignedArea role")
        .lean(),
      SalaryTransaction.find({ agent: { $in: targetAgentIds } })
        .populate("agent", "name phone email assignedArea role")
        .sort({ createdAt: -1 })
        .limit(agentId ? 50 : 200)
        .lean(),
    ]);

    const totals = wallets.reduce(
      (acc, wallet) => {
        acc.balance += wallet.balance || 0;
        acc.totalEarned += wallet.totalEarned || 0;
        acc.totalPaid += wallet.totalPaidOut || 0;
        return acc;
      },
      { balance: 0, totalEarned: 0, totalPaid: 0 }
    );

    const agentSummaries = wallets.map((wallet) => ({
      agentId: wallet.agent?._id,
      name: wallet.agent?.name || "Unknown",
      phone: wallet.agent?.phone || "",
      email: wallet.agent?.email || "",
      assignedArea: wallet.agent?.assignedArea || "",
      role: wallet.agent?.role || "",
      balance: wallet.balance || 0,
      totalEarned: wallet.totalEarned || 0,
      totalPaid: wallet.totalPaidOut || 0,
      lastCredit: wallet.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        balance: totals.balance,
        totalEarned: totals.totalEarned,
        totalPaid: totals.totalPaid,
        transactionCount: history.filter((t) => t.type === "credit").length,
        transactions: history,
        agentSummaries,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load salary summary",
    });
  }
};

export const getAllSalaryWallets = async (req, res) => {
  try {
    const wallets = await SalaryWallet.find()
      .populate("agent", "name phone email assignedArea role")
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = wallets.map((wallet) => ({
      agentId: wallet.agent?._id,
      name: wallet.agent?.name || "Unknown",
      phone: wallet.agent?.phone || "",
      email: wallet.agent?.email || "",
      assignedArea: wallet.agent?.assignedArea || "",
      role: wallet.agent?.role || "",
      salaryBalance: wallet.balance || 0,
      totalEarned: wallet.totalEarned || 0,
      totalPaid: wallet.totalPaidOut || 0,
      txnCount: 0,
      lastCredit: wallet.updatedAt,
    }));

    const totalOutstanding = formatted.reduce(
      (sum, wallet) => sum + (wallet.salaryBalance || 0),
      0
    );

    res.json({
      success: true,
      data: formatted,
      totalOutstanding,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load salary wallets",
    });
  }
};

// ADMIN - MANUAL SALARY ADJUSTMENT
export const adjustSalary = async (req, res) => {
  try {
    const { agentId, amount, note } = req.body;

    if (!agentId || !amount) {
      return res.status(400).json({
        success: false,
        message: "agentId and amount required",
      });
    }

    let wallet = await SalaryWallet.findOne({ agent: agentId });

    if (!wallet) {
      wallet = await SalaryWallet.create({
        agent: agentId,
        balance: 0,
        totalEarned: 0,
        totalPaidOut: 0,
      });
    }

    const amt = Number(amount);

    wallet.balance += amt;

    if (amt > 0) {
      wallet.totalEarned += amt;
    } else {
      wallet.totalPaidOut += Math.abs(amt);
    }

    await wallet.save();

    await SalaryTransaction.create({
      agent: agentId,
      amount: Math.abs(amt),
      type: amt >= 0 ? "credit" : "debit",
      source: "manual",
      note: note || "Manual salary adjustment",
    });

    res.json({ success: true, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Salary adjustment failed",
    });
  }
};

// ONE-TIME FIX
export const fixExistingPayoutWallets = async (req, res) => {
  try {
    const PayoutRequest = (await import("../models/Payoutrequest.js")).default;

    const paidPayouts = await PayoutRequest.find({
      status: "paid",
      salaryAmount: { $gt: 0 },
    }).lean();

    const results = [];

    for (const payout of paidPayouts) {
      const agentId = payout.agentId;
      const salaryAmt = payout.salaryAmount;

      const existing = await SalaryTransaction.findOne({
        agent: agentId,
        source: "payout",
        amount: salaryAmt,
        type: "debit",
      }).lean();

      if (existing) {
        results.push({
          agentId,
          salaryAmt,
          status: "skipped - debit already exists",
        });
        continue;
      }

      await SalaryWallet.findOneAndUpdate(
        { agent: agentId },
        {
          $inc: {
            balance: -salaryAmt,
            totalPaidOut: salaryAmt,
          },
        },
        { upsert: true }
      );

      await SalaryTransaction.create({
        agent: agentId,
        amount: salaryAmt,
        type: "debit",
        source: "payout",
        note: `Backfill - payout request Rs ${salaryAmt}`,
      });

      results.push({
        agentId,
        salaryAmt,
        status: "fixed",
      });
    }

    res.json({ success: true, fixed: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
