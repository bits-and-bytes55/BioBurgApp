import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Add product to wishlist
router.post("/add/:productId", protect, addToWishlist);

// Remove product from wishlist
router.delete("/remove/:productId", protect, removeFromWishlist);

// Get all wishlist products
router.get("/", protect, getWishlist);

export default router;
