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
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";


const router = express.Router();

// All routes protected
router.use(protectAgent);

// /api/agent/campaigns
router.route("/")
  .get(requireAgentPermission("marketing"), getCampaigns)
  .post(requireAgentPermission("marketing"), createCampaign);

router.get("/roi", requireAgentPermission("marketing"), getCampaignROI);

router.route("/:id")
  .get(requireAgentPermission("marketing"), getCampaign)
  .put(requireAgentPermission("marketing"), updateCampaign)
  .delete(requireAgentPermission("marketing"), deleteCampaign);

router.post("/:id/send", requireAgentPermission("marketing"), sendCampaign);


export default router;