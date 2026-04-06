import Lab from "../../models/pathology/Lab.js";
import LabBooking from "../../models/pathology/Booking.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generatePassword from "../../utils/generatePassword.js";

// ── REGISTER LAB ──────────────────────────────────────────────────────────────
export const registerLab = async (req, res) => {
  try {
    const { fullName, ownerName, email, mobile, address, servicesOffered } = req.body;

    const existingLab = await Lab.findOne({ email });
    if (existingLab) {
      return res.status(400).json({ message: "Lab already exists" });
    }

    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const lab = await Lab.create({
      fullName,
      ownerName,
      email,
      mobile,
      address,
      password: hashedPassword,
      servicesOffered: servicesOffered || [],
      status: "PENDING",
    });

    res.status(201).json({
      message: "Lab registered successfully",
      loginCredentials: { email, password: rawPassword },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LAB LOGIN ─────────────────────────────────────────────────────────────────
export const labLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const lab = await Lab.findOne({ email });
    if (!lab) {
      return res.status(404).json({ message: "Lab not found" });
    }

    const isMatch = await bcrypt.compare(password, lab.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { labId: lab._id, role: lab.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      lab: {
        _id: lab._id,
        fullName: lab.fullName,
        email: lab.email,
        role: lab.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET LAB PROFILE ───────────────────────────────────────────────────────────
export const getMyLabProfile = async (req, res) => {
  try {
    res.json({ success: true, data: req.lab });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch lab profile" });
  }
};

// ── GET DASHBOARD STATS ───────────────────────────────────────────────────────
export const getLabDashboardStats = async (req, res) => {
  try {
    if (!req.lab) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const lab = req.lab;

    // Count bookings from LabBooking model
    const totalBookings = await LabBooking.countDocuments({ labId: lab._id });
    const pendingBookings = await LabBooking.countDocuments({ labId: lab._id, status: "PENDING" });
    const completedBookings = await LabBooking.countDocuments({ labId: lab._id, status: "COMPLETED" });

    // Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todaysBookings = await LabBooking.countDocuments({
      labId: lab._id,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        todaysBookings,
        pendingBookings,
        completedBookings,
        servicesCount: lab.servicesOffered?.length || 0,
        profileStatus: lab.status,
      },
    });
  } catch (err) {
    console.error("LAB DASHBOARD ERROR", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET LAB BOOKINGS ──────────────────────────────────────────────────────────
export const getLabBookings = async (req, res) => {
  try {
    const bookings = await LabBooking.find({ labId: req.lab._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// ── UPDATE LAB SERVICES ───────────────────────────────────────────────────────
// Lab can add/remove/update their services list
export const updateLabServices = async (req, res) => {
  try {
    const { servicesOffered } = req.body;

    if (!Array.isArray(servicesOffered)) {
      return res.status(400).json({
        success: false,
        message: "servicesOffered must be an array",
      });
    }

    // Trim whitespace, remove empty strings, deduplicate
    const cleaned = [...new Set(
      servicesOffered
        .map(s => (typeof s === "string" ? s.trim() : ""))
        .filter(s => s.length > 0)
    )];

    const updated = await Lab.findByIdAndUpdate(
      req.lab._id,
      { $set: { servicesOffered: cleaned } },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Services updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Update services error:", err);
    res.status(500).json({ success: false, message: "Failed to update services" });
  }
};