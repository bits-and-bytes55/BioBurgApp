import express from "express";
import {
  upsertPlan,
  getPlan,
  getDailyPlan,
  deletePlan,
} from "../controllers/dailyPlanController.js";

import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

router.post("/:planType/upsert", protectAgent, upsertPlan);
router.get("/:planType/:startDate/:endDate", protectAgent, getPlan);
router.get("/:date", protectAgent, getDailyPlan);
router.delete("/:planType/:startDate/:endDate", protectAgent, deletePlan);

export default router;