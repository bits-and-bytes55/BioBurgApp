// backend/controllers/authController.js
import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import bcrypt from "bcryptjs";

/**
 * Utility: Create JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/**
 * @desc   Register Admin (one-time or guarded)
 * @route  POST /api/admin/register
 * @access Public (you can protect with secret if required)
 */
export const registerAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "All fields required" });

    // Check existing admin
    const existing = await Admin.findOne({ username });
    if (existing)
      return res.status(400).json({ message: "Admin already exists" });

    // Create admin (password hashing handled by model)
    const admin = await Admin.create({ username, password });

    // Generate token
    const token = generateToken(admin._id);
    console.log(token)

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        username: admin.username
      },
      token,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Error creating admin", error });
  }
};

/**
 * @desc   Login Admin
 * @route  POST /api/admin/login
 * @access Public
 */
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "All fields required" });

    const admin = await Admin.findOne({ username });
    if (!admin)
      return res.status(404).json({ message: "Admin not found" });

    const isMatch = await admin.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(admin._id);
    console.log(token)


    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error });
  }
};

/**
 * @desc   Verify Admin token
 * @route  GET /api/admin/me
 * @access Private
 */
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin)
      return res.status(404).json({ message: "Admin not found" });

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get Admin Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
