import express from "express";
import {
  getPendingVendors,
  getApprovedVendors,
  updateVendorStatus,
  getVendorDetails,
} from "../../../controllers/vendor/admin/adminVendor.controller.js";
import { adminProtect } from "../../../middleware/adminAuth.js";

const router = express.Router();

router.get("/pending", adminProtect, getPendingVendors);
router.get("/approved", adminProtect, getApprovedVendors);
router.put("/:vendorId/status", adminProtect, updateVendorStatus);
router.get("/:vendorId", adminProtect, getVendorDetails);

export default router;
