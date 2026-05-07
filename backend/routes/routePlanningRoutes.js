// routes/routePlanningRoutes.js
import express from "express";
import {
  getRoute, upsertRoute, updateStopStatus, deleteStop, getHistory,
} from "../controllers/Routeplanning.controller.js";
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

router.get("/history",                          protectAgent, getHistory);
router.get("/:date",                            protectAgent, getRoute);
router.post("/upsert",                          protectAgent, upsertRoute);
router.patch("/:date/stop/:stopId/status",      protectAgent, updateStopStatus);
router.delete("/:date/stop/:stopId",            protectAgent, deleteStop);

export default router;