import express from "express";
import {
  registerAgent,
  loginAgent,
  getAgentProfile,
  getJobHistory,
  startJob,
  getJobStatus,
  updateLiveLocation,
  closeJob,
  saveJobDetails,
  getAgentProfileWithJob,
  getAgentProducts,
  saveResponse,
  getResponses
} from "../controllers/marketingAgentController.js";

import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

/* ===============================
   AUTH ROUTES (UNCHANGED)
================================ */
router.post("/register", registerAgent);
router.post("/login", loginAgent);
router.get("/profile", protectAgent, getAgentProfile);
router.get("/job/history", protectAgent, getJobHistory);
/* ===============================
   JOB TRACKING ROUTES
================================ */

// Start new job
router.post("/start-job", protectAgent, startJob);
router.get("/job-status", protectAgent, getJobStatus);

//Live GPS tracking
router.post("/job/location", protectAgent, updateLiveLocation);

//Close current job
router.post("/close-job", protectAgent, closeJob);

// Final save (form data + hospital image)
router.post("/job/save", protectAgent, saveJobDetails);
router.get("/profile-with-job", protectAgent, getAgentProfileWithJob);
router.get("/products/all", protectAgent, getAgentProducts);
router.post("/responses",  protectAgent, saveResponse);
router.get("/responses",   protectAgent, getResponses);

export default router;
