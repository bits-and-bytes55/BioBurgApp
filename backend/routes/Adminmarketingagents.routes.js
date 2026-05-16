import express from "express";
import {
  getAllAgents,
  getAgentById,
  approveAgent,
  revokeAgent,
  blockAgentGps,
  unblockAgentGps,
  getAgentJobHistory,
  updateAgentSettings,
  updateMarketingAgentAccess,
  getAgentLiveData,
  deleteStartProofImage,
  getMarketingAgentRoles,
  createMarketingAgentRole,
} from "../controllers/Adminmarketingagent.controller.js";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminMiddleware);

router.get("/roles/list", getMarketingAgentRoles);
router.post("/roles", createMarketingAgentRole);
router.get("/", getAllAgents);

router.get("/:id", getAgentById);
router.get("/:id/job-history", getAgentJobHistory);
router.get("/:id/live-data", getAgentLiveData);

router.patch("/:id/access", updateMarketingAgentAccess);
router.patch("/:id/approve", approveAgent);
router.patch("/:id/revoke", revokeAgent);
router.patch("/:id/block-gps", blockAgentGps);
router.patch("/:id/unblock-gps", unblockAgentGps);
router.patch("/:id/settings", updateAgentSettings);

router.delete("/:id/start-proof", deleteStartProofImage);

export default router;
