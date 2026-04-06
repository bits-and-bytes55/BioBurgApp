import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import Order from "../models/Order.js";
import Booking from "../models/radiology/Booking.model.js";
import Report from "../models/radiology/Report.model.js";
import LabBooking from "../models/pathology/Booking.js";
import Reports from "../models/pathology/Report.js";

// ======================
// AUTH
// ======================
export const signup = async (req, res) => {
  try {
    const {
      username,
      name,
      lastname,
      gender,
      address,
      email,
      password,
      role,
    } = req.body;

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const exist = await User.findOne({ email: email.toLowerCase() });
    if (exist) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // AFTER — accept role from request body, return it in userData

const user = await User.create({
  username,
  name,
  lastname,
  gender,
  address,
  email: email.toLowerCase(),
  password,
  role: role || "customer",  
});

const token = generateToken(user._id, user.role);

const userData = {
  _id: user._id,
  username: user.username,
  name: user.name,
  lastname: user.lastname,
  gender: user.gender,
  address: user.address,
  email: user.email,
  role: user.role,         
};

    res.json({
      success: true,
      message: "User registered successfully",
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Required fields check
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please enter email and password" });
    }

    // 2. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 3. Compare password (using matchPassword method from model)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 5. Remove password from user object
    const userData = {
      _id: user._id,
      username: user.username,
      name: user.name,
      lastname: user.lastname,
      gender: user.gender,
      address: user.address,
      email: user.email,
      role: user.role,
    };

    // 6. Send response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// PROFILE
// ======================
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // req.user already password removed in middleware
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: req.user
    });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    // Password ko update karne ka option mat do
    if (req.body.password || req.body.email) {
      return res
        .status(400)
        .json({ message: "Email or password cannot be updated from this route." });
    }

    //  Allowed fields
    const allowedUpdates = ["name", "lastname", "gender", "address"];

    //  Filter only allowed fields
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        updates[field] = req.body[field];
      }
    });

    //  Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ======================
// ADDRESS
// ======================
export const getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.addresses);
};

export const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.addresses.push(req.body);
  await user.save();

  res.json({ success: true, addresses: user.addresses });
};

export const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.addresses = user.addresses.filter(
    (address) => address._id.toString() !== req.params.id
  );

  await user.save();
  res.json({ success: true, addresses: user.addresses });
};

// ======================
// WISHLIST
// ======================
export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.json(user.wishlist);
};

export const addToWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.wishlist.includes(req.params.productId)) {
    user.wishlist.push(req.params.productId);
    await user.save();
  }

  res.json({ success: true, wishlist: user.wishlist });
};

export const removeFromWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.wishlist = user.wishlist.filter(
    (id) => id.toString() !== req.params.productId
  );

  await user.save();
  res.json({ success: true, wishlist: user.wishlist });
};

// ======================
// COUPONS
// ======================
export const getCoupons = async (req, res) => {
  res.json([
    { code: "BIO10", discount: 10 },
    { code: "BIO20", discount: 20 }
  ]);
};

// ======================
// PRESCRIPTIONS
// ======================
export const getPrescriptions = async (req, res) => {
  const user = await User.findById(req.user._id).select("prescriptions");
  res.json(user.prescriptions || []);
};

// ======================
// CHANGE PASSWORD
// ======================
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const match = await user.matchPassword(oldPassword);

    if (!match)
      return res.status(400).json({ message: "Old password incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// EXTRA USER PAGES
// ======================

// ORDERS
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("items.productId", "name images price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};
// GET /api/user/orders/:id — fetch single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("items.productId", "name images price");

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order", error: err.message });
  }
};
// BUY AGAIN
export const getBuyAgain = async (req, res) => {
  res.json({
    success: true,
    products: []
  });
};

// CONSULTATIONS

export const getConsultations = async (req, res) => {
  try {
    const userId = req.user._id;

    const radiologyReports = await Report.find({ userId })
      .populate("bookingId")
      .sort({ createdAt: -1 });

    const labBookings = await LabBooking.find({ userId });
    const labReports = await Reports.find({ userId });

    const radiologyData = radiologyReports.map(r => {
      const booking = r.bookingId || {};

      let reportUrl = r.reportFile?.url || "";
      if (reportUrl.includes("/image/upload/")) {
        reportUrl = reportUrl.replace("/image/upload/", "/raw/upload/");
      }

      return {
        _id: r._id,
        ...(booking.toObject ? booking.toObject() : {}),
        type: "RADIOLOGY",
        report: {
          ...r.toObject(),
          reportFile: {
            ...r.reportFile,
            url: reportUrl,
          },
        },
        createdAt: r.createdAt,
      };
    });

    const labBookingData = labBookings
      .filter(b => b.reportFile?.url)
      .map(b => {
        let reportUrl = b.reportFile.url;
        if (reportUrl.includes("/image/upload/")) {
          reportUrl = reportUrl.replace("/image/upload/", "/raw/upload/");
        }
        return {
          ...b.toObject(),
          type: "LAB",
          report: { url: reportUrl },
          createdAt: b.createdAt,
        };
      });

    const labReportData = labReports.map(r => {
      let reportUrl = r.reportUrl || "";
      if (reportUrl.includes("/image/upload/")) {
        reportUrl = reportUrl.replace("/image/upload/", "/raw/upload/");
      }
      return {
        _id: r._id,
        type: "LAB",
        report: { url: reportUrl },
        createdAt: r.createdAt,
      };
    });

    const consultations = [
      ...radiologyData,
      ...labBookingData,
      ...labReportData,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, consultations });

  } catch (err) {
    console.error("CONSULTATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch consultations",
    });
  }
};
// PATIENTS
export const getPatients = async (req, res) => {
  const user = await User.findById(req.user._id).select("patients");
  res.json(user?.patients || []);
};

// PREFERENCES
export const getPreferences = async (req, res) => {
  const user = await User.findById(req.user._id).select("preferences");
  res.json(user?.preferences || {});
};

// Q&A
export const getQA = async (req, res) => {
  res.json({
    success: true,
    questions: []
  });
};