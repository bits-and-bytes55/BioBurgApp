// routes/vendor/vendorProducts.routes.js
import express from "express";
import mongoose from "mongoose";
import Product from "../../models/Product.js";
import { getVendorProducts } from "../../controllers/vendor/vendorProducts.controller.js";
import { protect } from "../../middleware/athMiddleware.js";
import cloudinary from "../../config/cloudinary.js";
import { deleteFromCloudinary } from "../../utils/cloudinaryDelete.js";
const router = express.Router();

router.get("/products", protect(["vendor"]), getVendorProducts);

// ── GET single vendor product ──────────────────────────────────
router.get("/products/:id", protect(["vendor"]), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: vendorId,
    })
      .populate("category", "title")
      .populate("subCategory", "title");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor",
      });
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── UPDATE single vendor product ───────────────────────────────
router.put("/products/:id", protect(["vendor"]), async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Confirm product belongs to this vendor
    const existing = await Product.findOne({
      _id: req.params.id,
      vendor: vendorId,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor",
      });
    }

    // Handle base64 images if sent
    let imageUrls = existing.images;
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
      const uploadPromises = req.body.images.map((base64) =>
        cloudinary.uploader.upload(base64, { folder: "vendor-products" })
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((r) => ({ url: r.secure_url, public_id: r.public_id }));
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, images: imageUrls, vendor: vendorId },
      { new: true, runValidators: false }
    );

    res.json({ success: true, message: "Product updated", product: updated });
  } catch (err) {
    console.error("Vendor product update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE vendor product + Cloudinary cleanup ─────────────────
router.delete("/products/:id", protect(["vendor"]), async (req, res) => {
  try {
    const vendorId = req.user._id;

    const product = await Product.findOne({
      _id: req.params.id,
      vendor: vendorId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor",
      });
    }

    // ── Delete all images from Cloudinary ──────────────────────
    if (product.images && product.images.length > 0) {
      await Promise.allSettled(
        product.images.map((img) => {
          const publicId = img?.public_id || img?.publicId;
          if (publicId) return deleteFromCloudinary(publicId, "image");
        }).filter(Boolean)
      );
    }

    // ── Delete video from Cloudinary ───────────────────────────
    if (product.video?.public_id) {
      await deleteFromCloudinary(product.video.public_id, "video");
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product and all media deleted successfully",
    });
  } catch (err) {
    console.error("Vendor product delete error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.post("/products/tag", protect(["vendor"]), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "Provide productIds array" });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { vendor: new mongoose.Types.ObjectId(String(vendorId)) } }
    );

    res.json({
      success: true,
      message: `Tagged ${result.modifiedCount} product(s) to your account`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;