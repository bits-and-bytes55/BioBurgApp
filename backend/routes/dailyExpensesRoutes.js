// routes/dailyExpensesRoutes.js
import express from "express";
import {
  getExpense, upsertExpense, submitExpense,
  getMonthExpenses, getMonthlySummary,
  getBudget, setBudget,
  getAllAgentsExpenses, approveExpense, rejectExpense,
} from "../controllers/dailyExpensesController.js";
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

//  Admin routes FIRST (before /:date wildcard) 
router.get("/admin/all/:year/:month",     adminProtect, getAllAgentsExpenses);
router.patch("/admin/:expenseId/approve", adminProtect, approveExpense);
router.patch("/admin/:expenseId/reject",  adminProtect, rejectExpense);

//  Agent routes 
router.get("/budget",               protectAgent, getBudget);
router.patch("/budget",             protectAgent, setBudget);
router.get("/month/:year/:month",   protectAgent, getMonthExpenses);
router.get("/summary/:year/:month", protectAgent, getMonthlySummary);
router.get("/:date",                protectAgent, getExpense);
router.post("/upsert",              protectAgent, upsertExpense);
router.post("/:date/submit",        protectAgent, submitExpense);

export default router;