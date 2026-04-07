// controllers/pointsAgentController.js

import mongoose from "mongoose";
import AgentPoints from "../models/AgentPoints.js";
import PayoutRequest from "../models/PayoutRequest.js";

const POINTS_TO_RUPEE_RATE = 1; 

// helper — middleware sets req.user = { id, role }
const getAgentId = (req) => req.user?.id || req.user?._id;

//  GET /api/points/agent/summary
export const getAgentSummary = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const history = await AgentPoints.find({ agentId }).sort({ createdAt: -1 }).lean();

    const totalEarned   = history.filter((h) => h.points > 0).reduce((s, h) => s + h.points, 0);
    const totalRedeemed = history.filter((h) => h.points < 0).reduce((s, h) => s + Math.abs(h.points), 0);
    const balance       = totalEarned - totalRedeemed;

    return res.json({
      success: true,
      data: {
        totalEarned,
        totalRedeemed,
        balance,
        amountEquivalent: balance * POINTS_TO_RUPEE_RATE,
        conversionRate: POINTS_TO_RUPEE_RATE,
        history,
      },
    });
  } catch (err) {
    console.error("[getAgentSummary]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  GET /api/points/agent/payouts
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

//  POST /api/points/agent/redeem 
export const redeemPoints = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const { pointsToRedeem, bankDetails } = req.body;

    if (!pointsToRedeem || Number(pointsToRedeem) < 100) {
      return res.status(400).json({ success: false, message: "Minimum 100 points required to redeem" });
    }

    // Live balance check
    const allPoints = await AgentPoints.find({ agentId }).lean();
    const balance   = allPoints.reduce((s, h) => s + h.points, 0);

    if (Number(pointsToRedeem) > balance) {
      return res.status(400).json({ success: false, message: "Insufficient points balance" });
    }

    // Block duplicate pending
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

    const amount = Number(pointsToRedeem) * POINTS_TO_RUPEE_RATE;

    const payout = await PayoutRequest.create({
      agentId,
      agentName:      req.user?.name  || "",
      agentPhone:     req.user?.phone || "",
      pointsRedeemed: Number(pointsToRedeem),
      amountRequested: amount,
      bankDetails,
    });

    // Deduct points immediately as "pending payout"
    await AgentPoints.create({
      agentId,
      taskKey:        "payout_request",
      taskLabel:      "Payout Request",
      points:         -Number(pointsToRedeem),
      referenceId:    payout._id.toString(),
      referenceModel: "PayoutRequest",
      note:           `Payout request submitted — ₹${amount}`,
      addedBy:        "system",
    });

    return res.status(201).json({ success: true, data: payout });
  } catch (err) {
    console.error("[redeemPoints]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};