import express from "express";
import {
  forgotBulkManufacturingPassword,
  bulkManufacturingLogin,
  getBulkManufacturingMe,
  resetBulkManufacturingPassword,
} from "../controllers/bulkManufacturingAuthController.js";
import bulkManufacturingAuth from "../middleware/bulkManufacturingAuth.js";

const router = express.Router();

router.post("/login", bulkManufacturingLogin);
router.post("/forgot-password", forgotBulkManufacturingPassword);
router.post("/reset-password", resetBulkManufacturingPassword);
router.get("/me", bulkManufacturingAuth, getBulkManufacturingMe);

export default router;
