import express from "express";

import {
  submitLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// AGENT
router.post("/", protectAgent, submitLeave);
router.get("/", protectAgent, getMyLeaves);

// ADMIN
router.get("/admin/all", protect, adminMiddleware, getAllLeaves);

router.patch("/admin/:id",protect,adminMiddleware, updateLeaveStatus);

export default router;