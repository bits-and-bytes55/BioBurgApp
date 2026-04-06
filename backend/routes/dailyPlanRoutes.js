import express from "express";
import {
  saveDailyPlan,
  getAllDailyPlans,
  getDailyPlanByDate,
  updateDailyPlan,
  deleteDailyPlan
} from "../controllers/dailyPlanController.js";
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";
const router = express.Router();

router.post("/create", protectAgent, saveDailyPlan);          // create
router.get("/", protectAgent, getAllDailyPlans);        // list
router.get("/:date", protectAgent, getDailyPlanByDate); // read
router.put("/:date", protectAgent, updateDailyPlan);    // update
router.delete("/:date", protectAgent, deleteDailyPlan); // delete

export default router;
