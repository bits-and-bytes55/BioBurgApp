import express from "express";
import { getVendorDashboard } from "../../controllers/vendor/vendorDashboard.controller.js";
import { protect } from "../../middleware/athMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect(["vendor"]),
  getVendorDashboard
);

export default router;
