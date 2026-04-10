import express from "express";
import {
  registerAgent,
  loginAgent,
  getAgentProfile,
  getJobRequirements,
  startJob,
  getJobStatus,
  updateLiveLocation,
  closeJob,
  saveJobDetails,
  getAgentProfileWithJob,
  getCompletedLeads,
  getAgentProducts,
  getJobHistory,
  saveResponse,
  getResponses,
} from "../controllers/marketingAgentController.js";
import { protectAgent } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", registerAgent);
router.post("/login", loginAgent);

// Protected — agent auth
router.use(protectAgent);

router.get("/profile", getAgentProfile);
router.get("/profile-with-job", getAgentProfileWithJob);
router.get("/job-requirements", getJobRequirements);

router.post("/start-job", startJob);
router.get("/job-status", getJobStatus);
router.post("/location/update", updateLiveLocation); 
router.post("/close-job", closeJob);
router.post("/job/save", saveJobDetails);
router.get("/job-history", getJobHistory);
router.get("/leads", getCompletedLeads);

router.get("/products", getAgentProducts);

router.post("/responses", saveResponse);
router.get("/responses", getResponses);

export default router;