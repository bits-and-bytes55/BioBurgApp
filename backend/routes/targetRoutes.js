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

import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

router.get("/options/all", getOptions);
router.post("/options/:key", addOption);

router.get("/my", protectAgent, getMyTargets);

router.get("/", getTargets);
router.post("/", createTarget);
router.put("/:id", updateTarget);
router.delete("/:id", deleteTarget);
router.post("/sync-points", syncPointsTargetsAchieved);
export default router;