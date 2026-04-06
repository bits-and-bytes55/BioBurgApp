import express from "express";
import User from "../models/User.js"; 

const router = express.Router();

// ── GET /api/admin/users ─────────────────────────────────────
// Fetch all D2C users
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total:    users.length,
      active:   users.filter((u) => !u.isBlocked).length,
      blocked:  users.filter((u) => u.isBlocked).length,
      verified: users.filter((u) => u.isVerified).length,
    };

    res.json({ success: true, users, stats });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── PUT /api/admin/users/:id ─────────────────────────────────
// Update user profile
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phone } },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("PUT /api/admin/users/:id error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── PATCH /api/admin/users/:id/block ────────────────────────
router.patch("/:id/block", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isBlocked: true } },
      { new: true }
    ).select("-password -__v");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User blocked", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── PATCH /api/admin/users/:id/unblock ──────────────────────
router.patch("/:id/unblock", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isBlocked: false } },
      { new: true }
    ).select("-password -__v");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User unblocked", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── DELETE /api/admin/users/:id ─────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;