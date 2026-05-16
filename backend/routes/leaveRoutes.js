import express from "express";

import {
  submitLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
} from "../controllers/leaveController.js";

import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";

import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/admin/all", protect, adminMiddleware, getAllLeaves);
router.patch("/admin/:id", protect, adminMiddleware, updateLeaveStatus);

router.post("/", protectAgent, requireAgentPermission("profile"), submitLeave);
router.get("/", protectAgent, requireAgentPermission("profile"), getMyLeaves);
router.delete("/:id", protectAgent, requireAgentPermission("profile"), cancelLeave);


export default router;