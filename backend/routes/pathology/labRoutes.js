import express from "express";
import {
  registerLab,
  labLogin,
  getMyLabProfile,
  getLabDashboardStats,
  getLabBookings,
  updateLabServices,
} from "../../controllers/pathology/labController.js";
import { authMiddleware } from "../../middleware/pathology/authMiddleware.js";
import Lab from "../../models/pathology/Lab.js";
import Partner from "../../models/radiology/Partner.model.js";
import LabBooking from "../../models/pathology/Booking.js";

const router = express.Router();

// ── AUTH ──────────────────────────────────────────────────────────────────────
router.post("/register", registerLab);
router.post("/login", labLogin);

// ── LAB PROFILE ──────────────────────────────────────────────────────────────
router.get("/profile", authMiddleware, getMyLabProfile);
router.get("/dashboard/stats", authMiddleware, getLabDashboardStats);

// ── LAB BOOKINGS (lab dashboard) ─────────────────────────────────────────────
router.get("/my-bookings", authMiddleware, getLabBookings);

// ── UPDATE SERVICES (lab can add/edit services) ───────────────────────────────
router.put("/update-services", authMiddleware, updateLabServices);

// ── PUBLIC: Get approved pathology labs ──────────────────────────────────────
router.get("/approved", async (req, res) => {
  try {
    const [labs, partners] = await Promise.all([
      Lab.find({ status: "APPROVED" }).select(
        "labName businessName city state mobile address labType businessType servicesOffered"
      ),
      Partner.find({
        status: "APPROVED",
        businessType: {
          $in: [
            "Pathology Laboratory",
            "Blood Collection Centre",
            "Home Sample Collection Service",
            "Diagnostic Centre",
          ],
        },
      }).select(
        "businessName city state mobile address businessType servicesOffered"
      ),
    ]);

    // Normalize Partner fields to match Lab fields
    const normalizedPartners = partners.map((p) => ({
      _id: p._id,
      labName: p.businessName,
      city: p.city,
      state: p.state,
      mobile: p.mobile,
      address: p.address,
      labType: p.businessType,
      servicesOffered: p.servicesOffered || [],  // ← CRITICAL: include services
    }));

    const combined = [...labs, ...normalizedPartners];
    res.json({ success: true, data: combined });
  } catch (err) {
    console.error("Fetch labs error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch labs" });
  }
});

// ── PUBLIC: Book a lab test (user-facing) ────────────────────────────────────
router.post("/book", async (req, res) => {
  try {
    const booking = await LabBooking.create({
      ...req.body,
      status: "PENDING",
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error("Lab booking error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;