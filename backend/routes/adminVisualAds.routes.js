// routes/adminVisualAds.routes.js
import express from "express";
import {
  createVisualAd,
  getAllVisualAds,
  getVisualAdById,
  updateVisualAd,
  deleteVisualAd,
  toggleVisualAdStatus,
} from "../controllers/adminVisualAds.controller.js";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect, adminMiddleware);

router.get("/", getAllVisualAds);
router.get("/:id", getVisualAdById);
router.post("/", createVisualAd);
router.put("/:id", updateVisualAd);
router.delete("/:id", deleteVisualAd);
router.patch("/:id/toggle", toggleVisualAdStatus);

export default router;