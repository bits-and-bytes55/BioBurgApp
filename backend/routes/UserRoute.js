import express from "express";
import {
  signup,
  login,
  getProfile,
  updateProfile,

  // Address
  addAddress,
  getAddresses,
  deleteAddress,

  // Wishlist
  getWishlist,
  addToWishlist,
  removeFromWishlist,

  // Coupons
  getCoupons,

  // Prescriptions
  getPrescriptions,

  // Password
  changePassword,

  // NEW PAGES (Add These)
  getOrders,
  getBuyAgain,
  getConsultations,
  getPatients,
  getPreferences,
  getQA,
  // uploadPrescriptionOrder
} from "../controllers/UserController.js";

import { protect } from "../middleware/authMiddleware.js";
import { uploadPrescriptionOrder } from "../controllers/prescriptionOrder.controller.js";

const router = express.Router();

// =======================
// AUTH
// =======================
router.post("/signup", signup);
router.post("/login", login);
router.get("/test", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// =======================
// PROFILE
// =======================
router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);

// =======================
// ADDRESS
// =======================
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.delete("/addresses/:id", protect, deleteAddress);

// =======================
// WISHLIST
// =======================
router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/:productId", protect, addToWishlist);
router.delete("/wishlist/:productId", protect, removeFromWishlist);

// =======================
// COUPONS
// =======================
router.get("/coupons", protect, getCoupons);

// =======================
// PRESCRIPTIONS
// =======================
router.get("/prescriptions", protect, getPrescriptions);

// =======================
// CHANGE PASSWORD
// =======================
router.put("/change-password", protect, changePassword);

// =======================
// NEW USER PANEL FEATURES
// =======================

// Orders
router.get("/orders", protect, getOrders);

// Buy Again
router.get("/buy-again", protect, getBuyAgain);

// Consultations
router.get("/consultations", protect, getConsultations);

// Patients
router.get("/patients", protect, getPatients);

// Preferences
router.get("/preferences", protect, getPreferences);

// Questions & Answers
router.get("/qa", protect, getQA);

router.post("/upload-prescription",protect, uploadPrescriptionOrder)
export default router;

