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
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectAgent);

// Stats
router.get("/stats", requireAgentPermission("giftManagement"), getGiftStats);

router.route("/")
  .get(requireAgentPermission("giftManagement"), getAllGifts)
  .post(requireAgentPermission("giftManagement"), createGift);

router.route("/:id")
  .put(requireAgentPermission("giftManagement"), updateGift)
  .delete(requireAgentPermission("giftManagement"), deleteGift);

router.post("/distribute", requireAgentPermission("giftManagement"), distributeGift);
router.get("/my-distributions", requireAgentPermission("giftManagement"), getMyDistributions);
router.get("/all-distributions", requireAgentPermission("giftManagement"), getAllDistributions);


export default router;