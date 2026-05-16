import express from "express";
import {
  upsertPlan,
  getPlan,
  getDailyPlan,
  deletePlan,
} from "../controllers/dailyPlanController.js";

import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/:planType/upsert", protectAgent, requireAgentPermission("workingPlan"), upsertPlan);
router.get("/:planType/:startDate/:endDate", protectAgent, requireAgentPermission("workingPlan"), getPlan);
router.get("/:date", protectAgent, requireAgentPermission("workingPlan"), getDailyPlan);
router.delete("/:planType/:startDate/:endDate", protectAgent, requireAgentPermission("workingPlan"), deletePlan);


export default router;