// routes/pointsPayoutRoutes.js
import express from "express";

import {
  getAgentSummary,
  getAgentPayouts,
  redeemPoints,
} from "../controllers/PointsAgentcontroller.js";

import {
  getPointsConfigs,
  upsertPointsConfig,
  deletePointsConfig,
  getAllPayouts,
  updatePayoutStatus,
  manuallyAwardPoints,
  getAgentPointsSummaries,
  getAdminLeads,
  getLeadsByAgent,
} from "../controllers/PointsAdmincontroller.js";

//  Middleware 
import { protectAgent as agentAuth } from "../middleware/marketingAgenTauthMiddleware.js";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// AGENT ROUTES 
router.get("/agent/summary", agentAuth, getAgentSummary);
router.get("/agent/payouts", agentAuth, getAgentPayouts);
router.post("/agent/redeem", agentAuth, redeemPoints);

// ADMIN ROUTES 
// Points config 
router.get("/admin/config", protect, adminMiddleware, getPointsConfigs);
router.post("/admin/config", protect, adminMiddleware, upsertPointsConfig);
router.delete("/admin/config/:taskKey", protect, adminMiddleware, deletePointsConfig);

// Payout management
router.get("/admin/payouts", protect, adminMiddleware, getAllPayouts);
router.patch("/admin/payouts/:id", protect, adminMiddleware, updatePayoutStatus);

// Manual award
router.post("/admin/award", protect, adminMiddleware, manuallyAwardPoints);

// Agent leaderboard
router.get("/admin/agents", protect, adminMiddleware, getAgentPointsSummaries);

// Leads 
router.get("/admin/leads", protect, adminMiddleware, getAdminLeads);
router.get("/admin/leads/:agentId", protect, adminMiddleware, getLeadsByAgent);

export default router;