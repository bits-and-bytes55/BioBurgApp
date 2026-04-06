import express from "express";
import { getVendorAnalytics } from "../../controllers/vendor/vendorAnalytics.controller.js";
import { protect } from "../../middleware/athMiddleware.js";

const router = express.Router();

// GET /api/vendor/analytics
router.get(
  "/analytics",
  protect(["vendor"]),
  getVendorAnalytics
);

export default router;
