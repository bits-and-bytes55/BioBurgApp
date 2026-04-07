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
} from "../controllers/marketingAgentController.js";

import { getMyResponses, createResponse } from "../controllers/Agentresponsecontroller.js";
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

/* AUTH ROUTES */
router.post("/register", registerAgent);
router.post("/login",    loginAgent);

/* PROFILE */
router.get("/profile",          protectAgent, getAgentProfile);
router.get("/profile-with-job", protectAgent, getAgentProfileWithJob);

/* JOB TRACKING */
router.post("/start-job",     protectAgent, startJob);
router.get("/job-status",     protectAgent, getJobStatus);
router.post("/job/location",  protectAgent, updateLiveLocation);
router.post("/close-job",     protectAgent, closeJob);
router.post("/job/save",      protectAgent, saveJobDetails);
router.get("/job/history",    protectAgent, getJobHistory);

/* PRODUCTS */
router.get("/products/all", protectAgent, getAgentProducts);
router.get("/responses",  protectAgent, getMyResponses);
router.post("/responses", protectAgent, createResponse);

export default router;