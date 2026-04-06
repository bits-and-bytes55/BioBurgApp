import express from "express";
import {
  getAdminBulkManufacturingAccounts,
  getAdminBulkManufacturingDocumentsQueue,
  getAdminBulkManufacturingOverview,
  getAdminBulkManufacturingOrders,
  getAdminBulkManufacturingRequestById,
  getAdminBulkManufacturingRequests,
  getAdminBulkManufacturingRequirements,
  resetAdminBulkManufacturingAccountPassword,
  updateAdminBulkManufacturingAccountStatus,
  updateAdminBulkManufacturingRequestStatus,
  updateAdminBulkManufacturingRequirement,
} from "../controllers/bulkManufacturingController.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/overview", adminProtect, getAdminBulkManufacturingOverview);
router.get("/requests", adminProtect, getAdminBulkManufacturingRequests);
router.get("/requests/:id", adminProtect, getAdminBulkManufacturingRequestById);
router.get("/orders", adminProtect, getAdminBulkManufacturingOrders);
router.patch(
  "/requests/:id/status",
  adminProtect,
  updateAdminBulkManufacturingRequestStatus,
);
router.get("/accounts", adminProtect, getAdminBulkManufacturingAccounts);
router.patch(
  "/accounts/:id/status",
  adminProtect,
  updateAdminBulkManufacturingAccountStatus,
);
router.post(
  "/accounts/:id/reset-password",
  adminProtect,
  resetAdminBulkManufacturingAccountPassword,
);
router.get("/requirements", adminProtect, getAdminBulkManufacturingRequirements);
router.patch(
  "/requirements/:id",
  adminProtect,
  updateAdminBulkManufacturingRequirement,
);
router.get("/documents", adminProtect, getAdminBulkManufacturingDocumentsQueue);

export default router;
