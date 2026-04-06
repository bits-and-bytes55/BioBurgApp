import express from "express";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getStats,
} from "../controllers/Jobssupport.js";

const router = express.Router();

// ── PUBLIC (applicant submits — no auth) ──────────────────────────
router.post("/", createTicket);

// ── ADMIN only — stats BEFORE /:id to avoid param collision ──────
router.get("/stats",  protect, adminMiddleware, getStats);
router.get("/",       protect, adminMiddleware, getAllTickets);
router.get("/:id",    protect, adminMiddleware, getTicketById);
router.patch("/:id",  protect, adminMiddleware, updateTicket);
router.delete("/:id", protect, adminMiddleware, deleteTicket);

export default router;