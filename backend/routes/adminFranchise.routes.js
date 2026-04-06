import express from "express";
import {
  approveFranchiseRequest,
  getAllFranchiseRequests,
  getAllFranchiseAccounts,
  getAdminFranchiseZoneOverview,
  toggleFranchiseStatus,
  getAdminFranchiseOrders,
  getFranchiseReportSummary,
  getFranchiseReportSales,
  getFranchiseSettlementSummary,
  getAdminFranchiseRestockRequests,
  updateAdminFranchiseRestockRequest,
  updateFranchiseSettlementConfig,
  updateFranchiseKyc,
  updateFranchiseReview,
  reassignFranchiseAccountZone,
} from "../controllers/adminFranchise.controller.js";

import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/requests", adminProtect, getAllFranchiseRequests);
router.put("/requests/:id/kyc", adminProtect, updateFranchiseKyc);
router.put("/requests/:id/review", adminProtect, updateFranchiseReview);
router.post("/franchise/approve", adminProtect, approveFranchiseRequest);
router.get("/franchise/accounts", adminProtect, getAllFranchiseAccounts);
router.get("/franchise/zones/overview", adminProtect, getAdminFranchiseZoneOverview);
router.put("/franchise/accounts/:id/zone", adminProtect, reassignFranchiseAccountZone);
router.put("/franchise/:id/settlement-config", adminProtect, updateFranchiseSettlementConfig);
router.get("/franchise/orders", adminProtect, getAdminFranchiseOrders);

// Specific routes BEFORE wildcard /:id routes
router.get("/franchise/reports/summary", adminProtect, getFranchiseReportSummary);
router.get("/franchise/reports/sales", adminProtect, getFranchiseReportSales);
router.get("/franchise/reports/settlements", adminProtect, getFranchiseSettlementSummary);
router.get("/franchise/restock-requests", adminProtect, getAdminFranchiseRestockRequests);
router.patch("/franchise/restock-requests/:id", adminProtect, updateAdminFranchiseRestockRequest);

router.put("/franchise/:id/status", adminProtect, toggleFranchiseStatus);

export default router;
