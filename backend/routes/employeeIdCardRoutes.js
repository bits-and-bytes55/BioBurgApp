import express from "express";
import {
  issueIDCard,
  getAllIDCards,
  getIDCardById,
  reissueIDCard,
  deleteIDCard,
  deactivateIDCard,
} from "../controllers/employeeIdCards.js";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminMiddleware, issueIDCard);
router.get("/", protect, adminMiddleware, getAllIDCards);
router.get("/:id", protect, adminMiddleware, getIDCardById);
router.put("/:id/reissue", protect, adminMiddleware, reissueIDCard);
router.delete("/:id", protect, adminMiddleware, deleteIDCard);
router.patch("/:id/deactivate", protect, adminMiddleware, deactivateIDCard);

export default router;