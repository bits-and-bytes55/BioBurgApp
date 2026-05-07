// routes/attendanceRoutes.js
import express from "express";
import {
  getToday, checkIn, checkOut,
  getMonthLog, getMonthlySummary,
  updateRecord, getHistory,
} from "../controllers/attendanceController.js";
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

router.get("/today",                    protectAgent, getToday);
router.post("/checkin",                 protectAgent, checkIn);
router.post("/checkout",                protectAgent, checkOut);
router.get("/month/:year/:month",       protectAgent, getMonthLog);
router.get("/summary/:year/:month",     protectAgent, getMonthlySummary);
router.get("/history",                  protectAgent, getHistory);
router.patch("/:date",                  protectAgent, updateRecord);

export default router;