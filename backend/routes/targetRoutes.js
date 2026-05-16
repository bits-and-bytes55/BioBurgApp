import express from "express";

import {
  getTargets,
  getMyTargets,
  createTarget,
  updateTarget,
  deleteTarget,
  getOptions,
  addOption,
  syncPointsTargetsAchieved,
} from "../controllers/targetController.js";

import {
  protectAgent,
  requireAgentPermission,
  protect,
  adminMiddleware,
} from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/options/all", protect, adminMiddleware, getOptions);
router.post("/options/:key", protect, adminMiddleware, addOption);

router.get("/my", protectAgent, requireAgentPermission("targets"), getMyTargets);

router.get("/", protect, adminMiddleware, getTargets);
router.post("/", protect, adminMiddleware, createTarget);
router.post("/sync-points", protect, adminMiddleware, syncPointsTargetsAchieved);
router.put("/:id", protect, adminMiddleware, updateTarget);
router.delete("/:id", protect, adminMiddleware, deleteTarget);

export default router;