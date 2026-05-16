// routes/dailyExpensesRoutes.js
import express from "express";
import {
  getExpense, upsertExpense, submitExpense,
  getMonthExpenses, getMonthlySummary,
  getBudget, setBudget,
  getAllAgentsExpenses, approveExpense, rejectExpense,
} from "../controllers/dailyExpensesController.js";
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";

import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

//  Admin routes FIRST (before /:date wildcard) 
router.get("/admin/all/:year/:month",     adminProtect, getAllAgentsExpenses);
router.patch("/admin/:expenseId/approve", adminProtect, approveExpense);
router.patch("/admin/:expenseId/reject",  adminProtect, rejectExpense);

//  Agent routes 
router.get("/budget", protectAgent, requireAgentPermission("dailyExpenses"), getBudget);
router.patch("/budget", protectAgent, requireAgentPermission("dailyExpenses"), setBudget);
router.get("/month/:year/:month", protectAgent, requireAgentPermission("dailyExpenses"), getMonthExpenses);
router.get("/summary/:year/:month", protectAgent, requireAgentPermission("dailyExpenses"), getMonthlySummary);
router.get("/:date", protectAgent, requireAgentPermission("dailyExpenses"), getExpense);
router.post("/upsert", protectAgent, requireAgentPermission("dailyExpenses"), upsertExpense);
router.post("/:date/submit", protectAgent, requireAgentPermission("dailyExpenses"), submitExpense);


export default router;