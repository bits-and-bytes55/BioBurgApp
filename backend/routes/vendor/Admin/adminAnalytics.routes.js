import express from "express";
import { getAdminVendorAnalytics } from "../../../controllers/vendor/admin/adminVendorAnalytics.controller.js";
import { adminProtect } from "../../../middleware/adminAuth.js";

const router = express.Router();

router.get(
  "/vendor/analytics",
  adminProtect,
  getAdminVendorAnalytics
);

export default router;
