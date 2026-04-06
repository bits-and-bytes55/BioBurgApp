import express from "express";
import { getAdminVendorDashboard } from "../../../controllers/vendor/admin/adminDashboard.controller.js";
import { adminProtect } from "../../../middleware/adminAuth.js";

const router = express.Router();

router.get(
  "/vendor/dashboard",
   adminProtect,
  getAdminVendorDashboard
);

export default router;
