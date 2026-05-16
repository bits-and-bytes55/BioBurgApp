// routes/routePlanningRoutes.js
import express from "express";
import {
  getRoute, upsertRoute, updateStopStatus, deleteStop, getHistory,
} from "../controllers/Routeplanning.controller.js";
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/history", protectAgent, requireAgentPermission("routePlanning"), getHistory);
router.get("/:date", protectAgent, requireAgentPermission("routePlanning"), getRoute);
router.post("/upsert", protectAgent, requireAgentPermission("routePlanning"), upsertRoute);
router.patch("/:date/stop/:stopId/status", protectAgent, requireAgentPermission("routePlanning"), updateStopStatus);
router.delete("/:date/stop/:stopId", protectAgent, requireAgentPermission("routePlanning"), deleteStop);


export default router;