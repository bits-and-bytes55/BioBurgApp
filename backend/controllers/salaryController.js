import SalaryWallet from "../models/salaryWallet.js";
import SalaryTransaction from "../models/salaryTransaction.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

// Agent summary
export const getAgentSalarySummary = async (req, res) => {
  try {
    const agentId = req.user.id;

    let wallet = await SalaryWallet.findOne({ agent: agentId });

    if (!wallet) {
      wallet = await SalaryWallet.create({ agent: agentId });
    }

    const history = await SalaryTransaction.find({ agent: agentId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        balance:          wallet.balance,
        totalEarned:      wallet.totalEarned,
        totalPaid:        wallet.totalPaidOut,
        transactionCount: history.filter(t => t.type === "credit").length,
        transactions:     history,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load salary summary" });
  }
};

export const getAllSalaryWallets = async (req, res) => {
  try {
    const wallets = await SalaryWallet.find()
      .populate("agent", "name phone email assignedArea")
      .sort({ updatedAt: -1 });

    const formatted = wallets.map(w => ({
      agentId:       w.agent?._id,
      name:          w.agent?.name  || "Unknown",
      phone:         w.agent?.phone || "",
      email:         w.agent?.email || "",
      salaryBalance: w.balance      || 0,
      totalEarned:   w.totalEarned  || 0,
      totalPaid:     w.totalPaidOut || 0,
      txnCount:      0,
      lastCredit:    w.updatedAt,
    }));

    const totalOutstanding = formatted.reduce((sum, w) => sum + (w.salaryBalance || 0), 0);

    res.json({ success: true, data: formatted, totalOutstanding });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load salary wallets" });
  }
};

// ADMIN - MANUAL SALARY ADJUSTMENT
export const adjustSalary = async (req, res) => {
  try {
    const { agentId, amount, note } = req.body;

    if (!agentId || !amount) {
      return res.status(400).json({ success: false, message: "agentId and amount required" });
    }

    let wallet = await SalaryWallet.findOne({ agent: agentId });

    if (!wallet) {
      wallet = await SalaryWallet.create({
        agent:        agentId,
        balance:      0,
        totalEarned:  0,
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
      agent:  agentId,
      amount: Math.abs(amt),
      type:   amt >= 0 ? "credit" : "debit",
      source: "manual",
      note:   note || "Manual salary adjustment",
    });

    res.json({ success: true, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Salary adjustment failed" });
  }
};

// ONE-TIME FIX — Run once then delete this route
export const fixExistingPayoutWallets = async (req, res) => {
  try {
    // Find all paid payouts that have salaryAmount > 0
    const PayoutRequest = (await import("../models/Payoutrequest.js")).default;

    const paidPayouts = await PayoutRequest.find({
      status:       "paid",
      salaryAmount: { $gt: 0 },
    }).lean();

    const results = [];

    for (const payout of paidPayouts) {
      const agentId   = payout.agentId;
      const salaryAmt = payout.salaryAmount;

      // Check if a debit transaction already exists for this payout
      const existing = await SalaryTransaction.findOne({
        agent:  agentId,
        source: "payout",
        amount: salaryAmt,
        type:   "debit",
      }).lean();

      if (existing) {
        results.push({ agentId, salaryAmt, status: "skipped — debit already exists" });
        continue;
      }

      // Deduct from wallet
      await SalaryWallet.findOneAndUpdate(
        { agent: agentId },
        { $inc: { balance: -salaryAmt, totalPaidOut: salaryAmt } },
        { upsert: true }
      );

      // Create the missing debit transaction
      await SalaryTransaction.create({
        agent:  agentId,
        amount: salaryAmt,
        type:   "debit",
        source: "payout",
        note:   `Backfill — payout request ₹${salaryAmt}`,
      });

      results.push({ agentId, salaryAmt, status: "fixed" });
    }

    res.json({ success: true, fixed: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};