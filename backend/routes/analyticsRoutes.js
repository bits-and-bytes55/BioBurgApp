// backend/routes/analyticsRoutes.js
import express from "express";
import { getSummary, getMonthlySales, getTarget } from "../controllers/analyticsController.js";

const router = express.Router();

// Summary KPIs
router.get("/summary", getSummary);

// Monthly sales range: ?start=YYYY-MM&end=YYYY-MM
router.get("/monthly-sales", getMonthlySales);

// Target percent: ?month=YYYY-MM
router.get("/target", getTarget);

export default router;
