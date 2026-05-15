import express from "express";

import {
  getAgentSalarySummary,
  getAllSalaryWallets,
  adjustSalary,
  fixExistingPayoutWallets,
} from "../controllers/salaryController.js";

import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// AGENT
router.get("/agent/summary",protectAgent,getAgentSalarySummary);

// ADMIN
router.get("/admin/all",adminProtect,getAllSalaryWallets);

router.post("/admin/adjust",adminProtect,adjustSalary);

router.post("/admin/fix-payout-wallets", adminProtect, fixExistingPayoutWallets);

export default router;