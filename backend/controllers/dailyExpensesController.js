// controllers/dailyExpensesController.js
import DailyExpense from "../models/dailyExpenses.js";
import MarketingAgent from "../models/MarketingAgent.model.js"; 
import SalaryWallet from "../models/salaryWallet.js";
import SalaryTransaction from "../models/salaryTransaction.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export const getBudget = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id).select("monthlyExpenseBudget name");
    const limit = agent?.monthlyExpenseBudget || 8000;
    res.json({ success: true, budget: { monthlyLimit: limit, currency: "INR" } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setBudget = async (req, res) => {
  try {
    const { monthlyLimit } = req.body;
    if (!monthlyLimit || isNaN(monthlyLimit) || monthlyLimit < 0)
      return res.status(400).json({ success: false, message: "Invalid budget amount" });
    await MarketingAgent.findByIdAndUpdate(req.user.id, { monthlyExpenseBudget: parseFloat(monthlyLimit) });
    res.json({ success: true, budget: { monthlyLimit: parseFloat(monthlyLimit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  GET /api/expenses/:date 
export const getExpense = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date    = req.params.date || todayStr();
    let record    = await DailyExpense.findOne({ agent: agentId, date });
    if (!record) record = await DailyExpense.create({ agent: agentId, date, entries: [], totalAmount: 0 });
    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  POST /api/expenses/upsert 
export const upsertExpense = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { date, entries, notes } = req.body;
    const total = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const record = await DailyExpense.findOneAndUpdate(
      { agent: agentId, date: date || todayStr() },
      { entries, totalAmount: parseFloat(total.toFixed(2)), notes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  POST /api/expenses/:date/submit 
export const submitExpense = async (req, res) => {
  try {
    const agentId = req.user.id;
    const date    = req.params.date || todayStr();
    const record  = await DailyExpense.findOne({ agent: agentId, date });
    if (!record)                     return res.status(404).json({ success: false, message: "No expense record found" });
    if (record.status === "submitted") return res.status(400).json({ success: false, message: "Already submitted" });
    if (!record.entries.length)        return res.status(400).json({ success: false, message: "No entries to submit" });
    record.status = "submitted"; record.submittedAt = new Date();
    await record.save();
    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  GET /api/expenses/month/:year/:month 
export const getMonthExpenses = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month).padStart(2, "0")}-31`;
    const records = await DailyExpense.find({ agent: agentId, date: { $gte: from, $lte: to } }).sort({ date: 1 });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month).padStart(2, "0")}-31`;

    const [records, agent] = await Promise.all([
      DailyExpense.find({ agent: agentId, date: { $gte: from, $lte: to } }),
      MarketingAgent.findById(agentId).select("monthlyExpenseBudget"),
    ]);

    const totalSpent   = records.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const monthlyLimit = agent?.monthlyExpenseBudget || 8000;

    const breakdown = {};
    records.forEach(r =>
      r.entries.forEach(e => {
        if (e.category) breakdown[e.category] = (breakdown[e.category] || 0) + (e.amount || 0);
      })
    );

    res.json({
      success: true,
      summary: {
        totalSpent:   parseFloat(totalSpent.toFixed(2)),
        totalDays:    records.length,
        submitted:    records.filter(r => ["submitted", "approved"].includes(r.status)).length,
        approved:     records.filter(r => r.status === "approved").length,
        breakdown,
        monthlyLimit,                                                              // ← real from DB
        balanceLeft:  parseFloat(Math.max(0, monthlyLimit - totalSpent).toFixed(2)),
        budgetPct:    monthlyLimit > 0 ? Math.min(Math.round((totalSpent / monthlyLimit) * 100), 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  GET /api/expenses/admin/all/:year/:month 
export const getAllAgentsExpenses = async (req, res) => {
  try {
    const { year, month } = req.params;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month).padStart(2, "0")}-31`;

    const records = await DailyExpense.find({
      date: { $gte: from, $lte: to },
    })
      .populate("agent", "name email phone assignedArea")
      .sort({ date: -1 });

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  PATCH /api/expenses/admin/:expenseId/approve 
export const approveExpense = async (req, res) => {
  try {
    const record = await DailyExpense.findById(req.params.expenseId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    // Prevent double credit
    if (record.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Expense already approved",
      });
    }

    // Approve expense
    record.status = "approved";
    record.approvedBy = req.user?.name || req.user?.email || "Admin";
    record.approvedAt = new Date();
    record.rejectedReason = undefined;

    await record.save();

    const amount = record.totalAmount || 0;

    let wallet = await SalaryWallet.findOne({
      agent: record.agent,
    });

    // Create wallet if not exists
    if (!wallet) {
      wallet = await SalaryWallet.create({
        agent: record.agent,
        balance: 0,
        totalEarned: 0,
        totalPaidOut: 0,
      });
    }

    // Credit amount
    wallet.balance += amount;
    wallet.totalEarned += amount;

    await wallet.save();

    // Transaction history
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
    const record = await DailyExpense.findById(req.params.expenseId);
    if (!record) return res.status(404).json({ success: false, message: "Not found" });

    record.status          = "rejected";
    record.rejectedReason  = reason || "Rejected by admin";
    record.approvedBy      = undefined;
    record.approvedAt      = undefined;
    await record.save();

    res.json({ success: true, expense: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};