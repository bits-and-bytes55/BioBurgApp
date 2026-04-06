import express from "express";
import {
  getAllProducts,
  getVendorProducts,
  toggleProductStatus,
  getProductById,
  updateProduct,
  deleteProduct,
  addProduct,
  searchProducts,
} from "../../../controllers/vendor/admin/adminProducts.controller.js";

import { adminProtect } from "../../../middleware/adminAuth.js";

const router = express.Router();

// ── Add product ─────────────────────────────────────────────────────────────
router.post("/products/add",             adminProtect, addProduct);

// ── List all vendors ─────────────────────────────────────────────────────────
router.get("/vendors", adminProtect, async (req, res) => {
  try {
    const Vendor = (await import("../../../models/Vendor.js")).default;
    const vendors = await Vendor.find({ isApproved: true })
      .select("_id fullName businessName email phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Search products (must be before /products and /product/:productId) ──────
router.get("/products/search",           adminProtect, searchProducts);

// ── List all ────────────────────────────────────────────────────────────────
router.get("/products",                  adminProtect, getAllProducts);

// ── Vendor-specific list ─────────────────────────────────────────────────────
router.get("/product/vendor/:vendorId",  adminProtect, getVendorProducts);

// ── Single product ───────────────────────────────────────────────────────────
router.get("/product/:productId",        adminProtect, getProductById);

// ── Status toggle ────────────────────────────────────────────────────────────
router.put("/product/:productId/status", adminProtect, toggleProductStatus);

// ── Update & Delete ──────────────────────────────────────────────────────────
router.put("/product/:productId",        adminProtect, updateProduct);
router.delete("/product/:productId",     adminProtect, deleteProduct);

export default router;