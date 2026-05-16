// controllers/dailyExpensesController.js
import mongoose from "mongoose";
import DailyExpense from "../models/dailyExpenses.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import SalaryWallet from "../models/salaryWallet.js";
import SalaryTransaction from "../models/salaryTransaction.js";

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

const getExpenseVisibleToViewer = async (viewerAgentId, expenseId) => {
  const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

  return DailyExpense.findOne({
    _id: expenseId,
    agent: { $in: visibleAgentIds },
  });
};

export const getBudget = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const agent = await MarketingAgent.findById(agentId).select(
      "monthlyExpenseBudget name"
    );

    const limit = agent?.monthlyExpenseBudget || 8000;

    res.json({
      success: true,
      budget: {
        monthlyLimit: limit,
        currency: "INR",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setBudget = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const { monthlyLimit } = req.body;

    if (!monthlyLimit || isNaN(monthlyLimit) || monthlyLimit < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget amount",
      });
    }

    await MarketingAgent.findByIdAndUpdate(agentId, {
      monthlyExpenseBudget: parseFloat(monthlyLimit),
    });

    res.json({
      success: true,
      budget: {
        monthlyLimit: parseFloat(monthlyLimit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/expenses/:date
export const getExpense = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const date = req.params.date || todayStr();

    let record = await DailyExpense.findOne({
      agent: agentId,
      date,
    });

    if (!record) {
      record = await DailyExpense.create({
        agent: agentId,
        date,
        entries: [],
        totalAmount: 0,
      });
    }

    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/expenses/upsert
export const upsertExpense = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const { date, entries = [], notes } = req.body;

    const total = entries.reduce(
      (s, e) => s + (parseFloat(e.amount) || 0),
      0
    );

    const record = await DailyExpense.findOneAndUpdate(
      {
        agent: agentId,
        date: date || todayStr(),
      },
      {
        entries,
        totalAmount: parseFloat(total.toFixed(2)),
        notes,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/expenses/:date/submit
export const submitExpense = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const date = req.params.date || todayStr();

    const record = await DailyExpense.findOne({
      agent: agentId,
      date,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No expense record found",
      });
    }

    if (record.status === "submitted") {
      return res.status(400).json({
        success: false,
        message: "Already submitted",
      });
    }

    if (!record.entries.length) {
      return res.status(400).json({
        success: false,
        message: "No entries to submit",
      });
    }

    record.status = "submitted";
    record.submittedAt = new Date();

    await record.save();

    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/expenses/month/:year/:month
export const getMonthExpenses = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-31`;

    const records = await DailyExpense.find({
      agent: { $in: visibleAgentIds },
      date: { $gte: from, $lte: to },
    })
      .populate("agent", "name email phone assignedArea role")
      .sort({ date: 1 })
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-31`;

    const [records, agents] = await Promise.all([
      DailyExpense.find({
        agent: { $in: visibleAgentIds },
        date: { $gte: from, $lte: to },
      })
        .populate("agent", "name email phone assignedArea role")
        .lean(),
      MarketingAgent.find({
        _id: { $in: visibleAgentIds },
      })
        .select("monthlyExpenseBudget")
        .lean(),
    ]);

    const totalSpent = records.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const monthlyLimit = agents.reduce(
      (s, agent) => s + (agent.monthlyExpenseBudget || 8000),
      0
    );

    const breakdown = {};
    records.forEach((record) => {
      (record.entries || []).forEach((entry) => {
        if (entry.category) {
          breakdown[entry.category] =
            (breakdown[entry.category] || 0) + (entry.amount || 0);
        }
      });
    });

    const agentSummaries = visibleAgentIds.map((agentId) => {
      const agentRecords = records.filter(
        (record) =>
          record.agent?._id?.toString() === agentId.toString() ||
          record.agent?.toString?.() === agentId.toString()
      );

      const spent = agentRecords.reduce(
        (s, record) => s + (record.totalAmount || 0),
        0
      );

      return {
        agentId,
        totalSpent: parseFloat(spent.toFixed(2)),
        totalDays: agentRecords.length,
        submitted: agentRecords.filter((r) =>
          ["submitted", "approved"].includes(r.status)
        ).length,
        approved: agentRecords.filter((r) => r.status === "approved").length,
      };
    });

    res.json({
      success: true,
      summary: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalDays: records.length,
        submitted: records.filter((r) =>
          ["submitted", "approved"].includes(r.status)
        ).length,
        approved: records.filter((r) => r.status === "approved").length,
        breakdown,
        monthlyLimit,
        balanceLeft: parseFloat(
          Math.max(0, monthlyLimit - totalSpent).toFixed(2)
        ),
        budgetPct:
          monthlyLimit > 0
            ? Math.min(Math.round((totalSpent / monthlyLimit) * 100), 100)
            : 0,
        agentSummaries,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/expenses/admin/all/:year/:month
export const getAllAgentsExpenses = async (req, res) => {
  try {
    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-31`;

    const records = await DailyExpense.find({
      date: { $gte: from, $lte: to },
    })
      .populate("agent", "name email phone assignedArea role")
      .sort({ date: -1 })
      .lean();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/expenses/admin/:expenseId/approve
export const approveExpense = async (req, res) => {
  try {
    let record;

    if (req.user?.role && req.user.role !== "admin") {
      record = await getExpenseVisibleToViewer(getAgentId(req), req.params.expenseId);
    } else {
      record = await DailyExpense.findById(req.params.expenseId);
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    if (record.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Expense already approved",
      });
    }

    record.status = "approved";
    record.approvedBy = req.user?.name || req.user?.email || "Admin";
    record.approvedAt = new Date();
    record.rejectedReason = undefined;

    await record.save();

    const amount = record.totalAmount || 0;

    let wallet = await SalaryWallet.findOne({
      agent: record.agent,
    });

    if (!wallet) {
      wallet = await SalaryWallet.create({
        agent: record.agent,
        balance: 0,
        totalEarned: 0,
        totalPaidOut: 0,
      });
    }

    wallet.balance += amount;
    wallet.totalEarned += amount;

    await wallet.save();

    await SalaryTransaction.create({
      agent: record.agent,
      amount,
      type: "credit",
      source: "expense_approval",
      expenseId: record._id,
      expenseDate: record.date,
      note: `Expense approved for ${record.date}`,
    });

    res.json({
      success: true,
      expense: record,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// PATCH /api/expenses/admin/:expenseId/reject
export const rejectExpense = async (req, res) => {
  try {
    const { reason } = req.body;

    let record;

    if (req.user?.role && req.user.role !== "admin") {
      record = await getExpenseVisibleToViewer(getAgentId(req), req.params.expenseId);
    } else {
      record = await DailyExpense.findById(req.params.expenseId);
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    record.status = "rejected";
    record.rejectedReason = reason || "Rejected by admin";
    record.approvedBy = undefined;
    record.approvedAt = undefined;

    await record.save();

    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
