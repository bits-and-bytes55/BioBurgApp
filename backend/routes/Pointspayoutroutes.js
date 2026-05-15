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
  getSlipByPayout,
  getAgentSlip,
} from "../controllers/PointsAdmincontroller.js";

import {
  getBankDetails,
  saveBankDetails,
  submitCorrectionRequest,
  adminGetCorrectionRequests,
  adminResolveCorrectionRequest,
} from "../controllers/bankDetailsController.js";

import {
  createPaymentIssue,
  getAgentIssues,
  replyToIssue,
  agentConfirmResolved,
  adminGetAllIssues,
  adminReplyToIssue,
  adminUpdateIssueStatus,
  updatePayoutSlip,
  uploadSlipLogo,
} from "../controllers/paymentIssueController.js";

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

router.get("/admin/slip/:payoutId",  protect, adminMiddleware, getSlipByPayout);
router.get("/agent/slip/:payoutId",  agentAuth, getAgentSlip);

// Agent bank routes
router.get ("/agent/bank-details",               agentAuth, getBankDetails);
router.post("/agent/bank-details",               agentAuth, saveBankDetails);
router.post("/agent/bank-details/correction",    agentAuth, submitCorrectionRequest);

// Admin correction routes
router.get  ("/admin/bank-corrections",          protect, adminMiddleware, adminGetCorrectionRequests);
router.patch("/admin/bank-corrections/:agentId", protect, adminMiddleware, adminResolveCorrectionRequest);

// Slip editing
router.patch("/admin/slip/:payoutId",    protect, adminMiddleware, updatePayoutSlip);
router.post ("/admin/slip/upload-logo",  protect, adminMiddleware, uploadSlipLogo);

// Payment issues — agent
router.post ("/agent/issues",            agentAuth, createPaymentIssue);
router.get  ("/agent/issues",            agentAuth, getAgentIssues);
router.post ("/agent/issues/:id/reply",  agentAuth, replyToIssue);
router.patch("/agent/issues/:id/confirm",agentAuth, agentConfirmResolved);

// Payment issues — admin
router.get  ("/admin/issues",            protect, adminMiddleware, adminGetAllIssues);
router.post ("/admin/issues/:id/reply",  protect, adminMiddleware, adminReplyToIssue);
router.patch("/admin/issues/:id/status", protect, adminMiddleware, adminUpdateIssueStatus);

export default router;