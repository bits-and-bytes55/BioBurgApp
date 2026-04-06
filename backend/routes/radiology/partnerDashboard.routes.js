import express from "express";
import authMiddleware from "../../middleware/radiology/auth.middleware.js";
import {
  getMyProfile,
  getPartnerBookings,
  getMyReports,
  uploadReport,
  createBooking,
  updateProfile, 
  updateBookingStatus,
} from "../../controllers/Radiology/partnerDashboard.controller.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile);
router.get("/bookings", authMiddleware, getPartnerBookings);
router.get("/reports", authMiddleware, getMyReports);
router.post("/upload", authMiddleware, uploadReport);
router.post("/create", authMiddleware, createBooking);
router.put("/update-profile", authMiddleware, updateProfile);
router.put("/bookings/:id/status", authMiddleware, updateBookingStatus);

export default router;
