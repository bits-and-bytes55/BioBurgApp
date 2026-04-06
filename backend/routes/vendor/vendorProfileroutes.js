// routes/vendor/vendorProfile.routes.js
import express from "express";
import Vendor from "../../models/Vendor.js";
import { protect } from "../../middleware/athMiddleware.js";
import cloudinary from "../../config/cloudinary.js";
import { deleteFromCloudinary } from "../../utils/cloudinaryDelete.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// ── GET /api/vendor/profile ─────────────────────────────────────
router.get("/profile", protect(["vendor"]), async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id).select("-password");
    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/vendor/update ──────────────────────────────────────
router.put("/update", protect(["vendor"]), async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword, password, ...rest } = req.body;

    const vendor = await Vendor.findById(req.user._id);
    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ success: false, message: "Current password required" });

      const isMatch = await vendor.matchPassword(currentPassword);
      if (!isMatch)
        return res.status(400).json({ success: false, message: "Current password is incorrect" });

      if (newPassword !== confirmPassword)
        return res.status(400).json({ success: false, message: "New passwords do not match" });

      vendor.password = newPassword; // pre-save hook will hash it
    }

    // Update all other fields
    const PROTECTED = ["_id", "email", "role", "isApproved", "createdAt"];
    Object.keys(rest).forEach((key) => {
      if (!PROTECTED.includes(key)) vendor[key] = rest[key];
    });

    await vendor.save();

    const updated = vendor.toObject();
    delete updated.password;

    res.json({ success: true, message: "Profile updated", vendor: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/vendor/profile/photo  (base64 upload) ────────────
router.post("/profile/photo", protect(["vendor"]), async (req, res) => {
  try {
    const { photo } = req.body; // base64 string e.g. "data:image/jpeg;base64,..."

    if (!photo)
      return res.status(400).json({ success: false, message: "No photo provided" });

    // Rough size check — base64 is ~1.37x original; 5MB raw ≈ 6.85MB base64
    const sizeInBytes = Buffer.byteLength(photo, "utf8");
    if (sizeInBytes > 7 * 1024 * 1024)
      return res.status(400).json({ success: false, message: "Image must be under 5MB" });

    const vendor = await Vendor.findById(req.user._id);
    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    // Delete old photo from Cloudinary if exists
    if (vendor.ownerPhotoPublicId) {
      await deleteFromCloudinary(vendor.ownerPhotoPublicId, "image").catch(() => {});
    }

    // Upload new photo
    const result = await cloudinary.uploader.upload(photo, {
      folder: "vendor-profiles",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    vendor.ownerPhoto         = result.secure_url;
    vendor.ownerPhotoPublicId = result.public_id;
    await vendor.save();

    res.json({ success: true, url: result.secure_url, message: "Photo updated" });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/vendor/profile/photo ───────────────────────────
router.delete("/profile/photo", protect(["vendor"]), async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id);
    if (!vendor)
      return res.status(404).json({ success: false, message: "Vendor not found" });

    if (!vendor.ownerPhotoPublicId)
      return res.status(400).json({ success: false, message: "No photo to delete" });

    await deleteFromCloudinary(vendor.ownerPhotoPublicId, "image");

    vendor.ownerPhoto         = "";
    vendor.ownerPhotoPublicId = "";
    await vendor.save();

    res.json({ success: true, message: "Photo deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;