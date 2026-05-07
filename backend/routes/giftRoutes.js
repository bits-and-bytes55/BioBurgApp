import express from "express";
import {
  getAllGifts,
  getGiftStats,
  createGift,
  updateGift,
  deleteGift,
  distributeGift,
  getMyDistributions,
  getAllDistributions,
} from "../controllers/giftController.js";
import { protectAgent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectAgent);

// Stats
router.get("/stats", getGiftStats);

// Catalog CRUD
router.route("/").get(getAllGifts).post(createGift);
router.route("/:id").put(updateGift).delete(deleteGift);

// Distribution
router.post("/distribute",          distributeGift);
router.get("/my-distributions",     getMyDistributions);
router.get("/all-distributions",    getAllDistributions);

export default router;