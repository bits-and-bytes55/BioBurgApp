import express from "express";
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
} from "../../controllers/pathology/bookingController.js";
import { authMiddleware } from "../../middleware/pathology/authMiddleware.js";

const router = express.Router();

// Create booking (admin / patient)
router.post("/create", createBooking);

// Lab dashboard
router.get("/my-bookings", authMiddleware, getMyBookings);
router.put("/:id/status", authMiddleware, updateBookingStatus);

export default router;
