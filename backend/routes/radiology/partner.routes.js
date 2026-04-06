import express from "express";
import {
  registerPartner,
  deletePartnerDocument,
  getPartnerProfile
} from "../../controllers/Radiology/partner.controller.js";
import Partner from "../../models/radiology/Partner.model.js"; 
import authMiddleware  from "../../middleware/radiology/auth.middleware.js";

const router = express.Router();

router.post("/register", registerPartner);
router.delete("/delete-document", deletePartnerDocument);

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Protected partner route",
    user: req.user,
  });
});
router.get("/profile", authMiddleware, getPartnerProfile);

// Public route — no token needed
router.get("/approved", async (req, res) => {
  try {
    const partners = await Partner.find({
      status: "APPROVED",
      businessType: { $regex: /radiology/i } 
    })
    .select("businessName city state mobile address businessType servicesOffered")
    .sort({ businessName: 1 });
    res.json({ success: true, data: partners });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch" });
  }
});

// Public user-facing booking route
router.post("/book", async (req, res) => {
  try {
    const Booking = (await import("../../models/radiology/Booking.model.js")).default;
    const booking = await Booking.create({
      ...req.body,
      status: "PENDING",
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
export default router;
