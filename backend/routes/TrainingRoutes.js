import express from "express";
import {
  listAgentsForAssignment,
  createTrainingModule,
  getAllModulesAdmin,
  getModuleByIdAdmin,
  updateTrainingModule,
  deleteTrainingModule,
  toggleVisibility,
  removeModuleVideo,
  getModuleResults,
  getAgentModules,
  getAgentModuleById,
  submitAttempt
} from "../controllers/Trainingcontroller.js";

import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

/*ADMIN*/
router.get("/admin/agents",               listAgentsForAssignment);
router.post("/admin/create",              createTrainingModule);
router.get("/admin/all",                  getAllModulesAdmin);
router.get("/admin/:id",                  getModuleByIdAdmin);
router.put("/admin/:id",                  updateTrainingModule);
router.delete("/admin/:id",               deleteTrainingModule);
router.patch("/admin/:id/visibility",     toggleVisibility);
router.delete("/admin/:id/video",         removeModuleVideo);
router.get("/admin/:id/results",          getModuleResults);

/*AGENT*/
router.get("/agent/modules",              protectAgent, getAgentModules);
router.get("/agent/modules/:id",          protectAgent, getAgentModuleById);
router.post("/agent/modules/:id/attempt", protectAgent, submitAttempt);

export default router;