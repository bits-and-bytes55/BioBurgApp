import express from "express";
import {
  registerVendor,
  loginVendor,
  forgotPassword,
  resetPassword,
  getVendorProfile,
  updateVendorProfile,
  updateVendorPassword,
} from "../../controllers/vendorController.js";
import { protect } from "../../middleware/athMiddleware.js";

const router = express.Router();

router.post("/register", registerVendor);
router.post("/login", loginVendor);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/profile",          protect(["vendor"]), getVendorProfile);
router.put("/update",           protect(["vendor"]), updateVendorProfile);
router.put("/change-password",  protect(["vendor"]), updateVendorPassword);

export default router;