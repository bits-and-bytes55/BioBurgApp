// routes/attendanceRoutes.js
import express from "express";
import {
  getToday, checkIn, checkOut,
  getMonthLog, getMonthlySummary,
  updateRecord, getHistory,
} from "../controllers/attendanceController.js";
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/today", protectAgent, requireAgentPermission("jobActivity"), getToday);
router.post("/checkin", protectAgent, requireAgentPermission("jobActivity"), checkIn);
router.post("/checkout", protectAgent, requireAgentPermission("jobActivity"), checkOut);
router.get("/month/:year/:month", protectAgent, requireAgentPermission("jobActivity"), getMonthLog);
router.get("/summary/:year/:month", protectAgent, requireAgentPermission("jobActivity"), getMonthlySummary);
router.get("/history", protectAgent, requireAgentPermission("jobActivity"), getHistory);
router.patch("/:date", protectAgent, requireAgentPermission("jobActivity"), updateRecord);


export default router;