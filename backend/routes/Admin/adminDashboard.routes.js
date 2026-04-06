import express from "express";
import { adminDashboardStats } from "../../controllers/Admin/adminDashboard.controller.js";
import { adminProtect } from "../../middleware/adminAuth.js";

const router = express.Router();

router.get("/", adminProtect, adminDashboardStats);

export default router;
