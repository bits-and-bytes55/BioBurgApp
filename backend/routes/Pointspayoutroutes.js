// routes/Pointspayoutroutes.js
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

import {
  protectAgent as agentAuth,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";

import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

//  AGENT ROUTES 
router.get ("/agent/summary",  agentAuth, requireAgentPermission("pointsPayout"), getAgentSummary);
router.get ("/agent/payouts",  agentAuth, requireAgentPermission("pointsPayout"), getAgentPayouts);
router.post("/agent/redeem",   agentAuth, requireAgentPermission("pointsPayout"), redeemPoints);

router.get ("/agent/bank-details",            agentAuth, requireAgentPermission("pointsPayout"), getBankDetails);
router.post("/agent/bank-details",            agentAuth, requireAgentPermission("pointsPayout"), saveBankDetails);
router.post("/agent/bank-details/correction", agentAuth, requireAgentPermission("pointsPayout"), submitCorrectionRequest);

router.get("/agent/slip/:payoutId", agentAuth, requireAgentPermission("pointsPayout"), getAgentSlip);

router.post ("/agent/issues",           agentAuth, requireAgentPermission("support"), createPaymentIssue);
router.get  ("/agent/issues",           agentAuth, requireAgentPermission("support"), getAgentIssues);
router.post ("/agent/issues/:id/reply", agentAuth, requireAgentPermission("support"), replyToIssue);

router.patch("/agent/issues/:id/confirm", agentAuth, requireAgentPermission("support"), agentConfirmResolved);


router.get   ("/admin/config",          protect, adminMiddleware, getPointsConfigs);
router.post  ("/admin/config",          protect, adminMiddleware, upsertPointsConfig);
router.delete("/admin/config/:taskKey", protect, adminMiddleware, deletePointsConfig);

// Payout management
router.get  ("/admin/payouts",     protect, adminMiddleware, getAllPayouts);
router.patch("/admin/payouts/:id", protect, adminMiddleware, updatePayoutStatus);

// Manual award
router.post("/admin/award", protect, adminMiddleware, manuallyAwardPoints);

// Agent leaderboard
router.get("/admin/agents", protect, adminMiddleware, getAgentPointsSummaries);

// Leads
router.get("/admin/leads",           protect, adminMiddleware, getAdminLeads);
router.get("/admin/leads/:agentId",  protect, adminMiddleware, getLeadsByAgent);

// Slip
router.post ("/admin/slip/upload-logo",  protect, adminMiddleware, uploadSlipLogo);
router.get  ("/admin/slip/:payoutId",    protect, adminMiddleware, getSlipByPayout);
router.patch("/admin/slip/:payoutId",    protect, adminMiddleware, updatePayoutSlip);

// Bank corrections
router.get  ("/admin/bank-corrections",          protect, adminMiddleware, adminGetCorrectionRequests);
router.patch("/admin/bank-corrections/:agentId", protect, adminMiddleware, adminResolveCorrectionRequest);

// Admin payment issues
router.get  ("/admin/issues",             protect, adminMiddleware, adminGetAllIssues);
router.post ("/admin/issues/:id/reply",   protect, adminMiddleware, adminReplyToIssue);
router.patch("/admin/issues/:id/status",  protect, adminMiddleware, adminUpdateIssueStatus);

export default router;