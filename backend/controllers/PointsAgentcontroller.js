// controllers/pointsAgentController.js
import mongoose    from "mongoose";
import AgentPoints from "../models/Agentpoints.js";
import PayoutRequest from "../models/Payoutrequest.js";
import SalaryTransaction from "../models/salaryTransaction.js";
import AgentBankDetails from "../models/agentBankDetails.js";
const POINTS_TO_RUPEE_RATE = 1;

const getAgentId = (req) => req.user?.id || req.user?._id;

export const getAgentSummary = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const history = await AgentPoints.find({ agentId })
      .sort({ createdAt: -1 })
      .lean();

    const totalEarned   = history.filter((h) => h.points > 0).reduce((s, h) => s + h.points, 0);
    const totalRedeemed = history.filter((h) => h.points < 0).reduce((s, h) => s + Math.abs(h.points), 0);
    const balance       = totalEarned - totalRedeemed;

    return res.json({
      success: true,
      data: {
        totalEarned,
        totalRedeemed,
        balance,
        amountEquivalent:  balance * POINTS_TO_RUPEE_RATE,
        conversionRate:    POINTS_TO_RUPEE_RATE,
        history,          
      },
    });
  } catch (err) {
    console.error("[getAgentSummary]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAgentPayouts = async (req, res) => {
  try {
    const payouts = await PayoutRequest.find({ agentId: getAgentId(req) })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: payouts });
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

    // Auto-fetch saved bank details if not sent in request body
    if (!bankDetails?.accountNumber && !bankDetails?.upiId) {
      const saved = await AgentBankDetails.findOne({ agentId }).lean();
      if (saved) {
        bankDetails = {
          accountHolder: saved.accountHolder,
          accountNumber: saved.accountNumber,
          ifsc:          saved.ifsc,
          bankName:      saved.bankName,
          upiId:         saved.upiId,
        };
      }
    }

    const pts    = Number(pointsToRedeem || 0);
    const salAmt = Number(salaryToRedeem || 0);

    if (pts <= 0 && salAmt <= 0) {
      return res.status(400).json({ success: false, message: "Enter an amount to redeem" });
    }

    if (pts > 0) {
      const allPoints = await AgentPoints.find({ agentId }).lean();
      const balance   = allPoints.reduce((s, h) => s + h.points, 0);
      if (pts > balance) {
        return res.status(400).json({ success: false, message: "Insufficient points balance" });
      }
    }

    if (salAmt > 0) {
      const wallet = await SalaryWallet.findOne({ agent: agentId }).lean();
      const salBal = wallet?.balance ?? 0;
      if (salAmt > salBal) {
        return res.status(400).json({ success: false, message: "Insufficient salary balance" });
      }
    }

    const pending = await PayoutRequest.findOne({ agentId, status: "pending" });
    if (pending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending payout request. Wait for it to be processed.",
      });
    }

    if (!bankDetails?.accountNumber && !bankDetails?.upiId) {
      return res.status(400).json({ success: false, message: "Provide bank account details or UPI ID" });
    }

    const pointsAmount = pts * POINTS_TO_RUPEE_RATE;
    const totalAmount  = pointsAmount + salAmt;

    const payout = await PayoutRequest.create({
      agentId,
      agentName:       req.user?.name  || "",
      agentPhone:      req.user?.phone || "",
      pointsRedeemed:  pts,
      salaryAmount:    salAmt,
      amountRequested: totalAmount,
      bankDetails,
    });

    if (pts > 0) {
      await AgentPoints.create({
        agentId,
        taskKey:        "payout_request",
        taskLabel:      "Payout Request",
        points:         -pts,
        referenceId:    payout._id.toString(),
        referenceModel: "PayoutRequest",
        note:           `Payout request — ${pts} pts (₹${pointsAmount})`,
        addedBy:        "system",
      });
    }

    if (salAmt > 0) {
      await SalaryWallet.findOneAndUpdate(
        { agent: agentId },
        { $inc: { balance: -salAmt, totalPaidOut: salAmt } },
        { upsert: true }
      );
      await SalaryTransaction.create({
        agent:  agentId,
        amount: salAmt,
        type:   "debit",
        source: "payout",
        note:   `Payout request ₹${salAmt}`,
      });
    }

    return res.status(201).json({ success: true, data: payout });
  } catch (err) {
    console.error("[redeemPoints]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};