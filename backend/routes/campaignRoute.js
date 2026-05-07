import express from "express";
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignROI,
} from "../controllers/marketingAgentController.js";
import { protectAgent } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected
router.use(protectAgent);

// /api/agent/campaigns
router.route("/")
  .get(getCampaigns)
  .post(createCampaign);

// /api/agent/campaigns/roi  ← MUST be before /:id
router.get("/roi", getCampaignROI);

// /api/agent/campaigns/:id
router.route("/:id")
  .get(getCampaign)
  .put(updateCampaign)
  .delete(deleteCampaign);

router.post("/:id/send", sendCampaign);

export default router;