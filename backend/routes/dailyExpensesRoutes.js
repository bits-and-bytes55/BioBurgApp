// routes/dailyExpensesRoutes.js
import express from "express";
import {
  getExpense, upsertExpense, submitExpense,
  getMonthExpenses, getMonthlySummary,
  getBudget, setBudget,
} from "../controllers/dailyExpensesController.js";
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

router.get("/budget",                   protectAgent, getBudget);
router.patch("/budget",                 protectAgent, setBudget);
router.get("/month/:year/:month",       protectAgent, getMonthExpenses);
router.get("/summary/:year/:month",     protectAgent, getMonthlySummary);
router.get("/:date",                    protectAgent, getExpense);
router.post("/upsert",                  protectAgent, upsertExpense);
router.post("/:date/submit",            protectAgent, submitExpense);

export default router;