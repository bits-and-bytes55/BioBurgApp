// routes/pointsPayoutRoutes.js

import express from "express";

// ── Agent-side controllers
import {
  getAgentSummary,
  getAgentPayouts,
  redeemPoints,
} from "../controllers/PointsAgentcontroller.js";

// ── Admin-side controllers
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
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// AGENT ROUTES 
router.get("/agent/summary",  agentAuth, getAgentSummary);
router.get("/agent/payouts",  agentAuth, getAgentPayouts);
router.post("/agent/redeem",  agentAuth, redeemPoints);

// ADMIN ROUTES 

// Points config (how many points per task)
router.get("/admin/config",             adminProtect, getPointsConfigs);
router.post("/admin/config",            adminProtect, upsertPointsConfig);
router.delete("/admin/config/:taskKey", adminProtect, deletePointsConfig);

// Payout management
router.get("/admin/payouts",        adminProtect, getAllPayouts);
router.patch("/admin/payouts/:id",  adminProtect, updatePayoutStatus);

// Manual award
router.post("/admin/award", adminProtect, manuallyAwardPoints);

// Agent leaderboard
router.get("/admin/agents", adminProtect, getAgentPointsSummaries);

// Leads (agent responses) — admin view
router.get("/admin/leads",            adminProtect, getAdminLeads);
router.get("/admin/leads/:agentId",   adminProtect, getLeadsByAgent);

export default router;