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
  submitAttempt,
  markVideoComplete 
} from "../controllers/Trainingcontroller.js";

import {
  protectAgent,
  requireAgentPermission,
  protect,
  adminMiddleware,
} from "../middleware/authMiddleware.js";


const router = express.Router();

/*ADMIN*/
router.get("/admin/agents", protect, adminMiddleware, listAgentsForAssignment);
router.post("/admin/create", protect, adminMiddleware, createTrainingModule);
router.get("/admin/all", protect, adminMiddleware, getAllModulesAdmin);
router.get("/admin/:id", protect, adminMiddleware, getModuleByIdAdmin);
router.put("/admin/:id", protect, adminMiddleware, updateTrainingModule);
router.delete("/admin/:id", protect, adminMiddleware, deleteTrainingModule);
router.patch("/admin/:id/visibility", protect, adminMiddleware, toggleVisibility);
router.delete("/admin/:id/video", protect, adminMiddleware, removeModuleVideo);
router.get("/admin/:id/results", protect, adminMiddleware, getModuleResults);

/*AGENT*/
router.get(
  "/agent/modules",
  protectAgent,
  requireAgentPermission("training"),
  getAgentModules
);

router.get(
  "/agent/modules/:id",
  protectAgent,
  requireAgentPermission("training"),
  getAgentModuleById
);

router.post(
  "/agent/modules/:id/attempt",
  protectAgent,
  requireAgentPermission("training"),
  submitAttempt
);

router.post(
  "/agent/modules/:id/complete",
  protectAgent,
  requireAgentPermission("training"),
  markVideoComplete
);


export default router;