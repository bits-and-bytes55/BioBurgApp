import express from "express";
import {
  registerPharmacy,
  loginPharmacy,
  forgotPharmacyPassword,
  resetPharmacyPassword,
  getAllPharmacies,
  getPharmacyProfile,
  updatePharmacyProfile,
  updatePharmacyPassword,
  getPharmacyDashboard,
  getMyPharmacyDashboard,
  updatePharmacyDashboardSection,
  getLoginHistory,         
} from "../controllers/pharmacyController.js";

import Pharmacy from "../models/Pharmacy.js";
import Order    from "../models/Order.js";

import { protectPharmacy } from "../middleware/Pharmacy/auth.js";
import {
  notifyPharmacyApproved,
  notifyPharmacyRejected,
} from "../services/notificationService.js";

const router = express.Router();

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
router.post("/register",        registerPharmacy);
router.post("/login",           loginPharmacy);        // sends email alert on every login
router.post("/forgot-password", forgotPharmacyPassword);
router.post("/reset-password",  resetPharmacyPassword);

// ── PHARMACY PROTECTED ROUTES ─────────────────────────────────────────────────
router.get( "/profile",          protectPharmacy, getPharmacyProfile);
router.put( "/profile",          protectPharmacy, updatePharmacyProfile);
router.put( "/password",         protectPharmacy, updatePharmacyPassword);
router.get( "/dashboard",        protectPharmacy, getMyPharmacyDashboard);
router.post("/dashboard/update", protectPharmacy, updatePharmacyDashboardSection);

// Bulk save multiple sections in one request (used by frontend for efficiency)
router.post("/dashboard/bulk-update", protectPharmacy, async (req, res) => {
  try {
    const pharmacyId = req.user.id;
    const { sections } = req.body;
    if (!sections || typeof sections !== "object")
      return res.status(400).json({ success: false, message: "sections object required" });

    const ALLOWED = ["inventory","billing","suppliers","customers","purchases","prescriptions","staff","orders","medicines","expiry","returns"];
    const updateObj = { updatedAt: new Date() };
    Object.keys(sections).forEach(k => {
      if (ALLOWED.includes(k) && Array.isArray(sections[k])) {
        updateObj[k] = sections[k];
        updateObj[`${k}UpdatedAt`] = new Date();
      }
    });

    const PharmacyDashboard = (await import("../models/pharmacyDashboard.js")).default;
    const dashboard = await PharmacyDashboard.findOneAndUpdate(
      { pharmacyId },
      { $set: updateObj },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, dashboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cloudinary delete helper
async function deleteCloudinaryUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return;
  try {
    const { v2: cloudinary } = await import("cloudinary");
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (match) await cloudinary.uploader.destroy(match[1]);
  } catch (e) { console.warn("Cloudinary delete:", e.message); }
}

// Profile photo upload/update — deletes old Cloudinary photo if applicable
router.put("/profile/photo", protectPharmacy, async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo)
      return res.status(400).json({ success: false, message: "Photo data required" });
    if (!photo.startsWith("data:image/") && photo !== "")
      return res.status(400).json({ success: false, message: "Invalid image format." });
    if (photo.length > 2 * 1024 * 1024 * 1.37)
      return res.status(413).json({ success: false, message: "Image too large. Maximum 2MB." });

    // Delete old photo from Cloudinary if it was a Cloudinary URL
    const existing = await Pharmacy.findById(req.user.id).select("profilePhoto");
    if (existing?.profilePhoto) await deleteCloudinaryUrl(existing.profilePhoto);

    const facility = await Pharmacy.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photo },
      { new: true }
    );
    res.json({ success: true, message: "Profile photo updated", profilePhoto: facility.profilePhoto });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete profile photo
router.delete("/profile/photo", protectPharmacy, async (req, res) => {
  try {
    const existing = await Pharmacy.findById(req.user.id).select("profilePhoto");
    if (existing?.profilePhoto) await deleteCloudinaryUrl(existing.profilePhoto);
    await Pharmacy.findByIdAndUpdate(req.user.id, { profilePhoto: "" });
    res.json({ success: true, message: "Photo deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login history (security log shown in Profile page)
router.get("/login-history", protectPharmacy, getLoginHistory);   // ← fixes 404

// My online orders from BioBurg platform
router.get("/my-orders", protectPharmacy, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
router.get("/all",           getAllPharmacies);
router.get("/dashboard/:id", getPharmacyDashboard);

router.patch("/approve/:id", async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { status: "approved", isApproved: true, approvedAt: new Date() },
      { new: true }
    );
    if (!pharmacy)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });

    notifyPharmacyApproved({
      name:         pharmacy.contactPerson || pharmacy.facilityName,
      email:        pharmacy.email,
      phone:        pharmacy.phone,
      facilityName: pharmacy.facilityName,
    }).catch(console.error);

    res.json({ success: true, message: `${pharmacy.facilityName} approved! Email & SMS sent.`, pharmacy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/reject/:id", async (req, res) => {
  try {
    const { reason } = req.body;
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", isApproved: false, rejectionReason: reason || "Rejected by admin" },
      { new: true }
    );
    if (!pharmacy)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });

    notifyPharmacyRejected({
      name:         pharmacy.contactPerson || pharmacy.facilityName,
      email:        pharmacy.email,
      phone:        pharmacy.phone,
      facilityName: pharmacy.facilityName,
      reason,
    }).catch(console.error);

    res.json({ success: true, message: "Pharmacy rejected. Email & SMS sent.", pharmacy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/orders-by-pharmacy/:id", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;