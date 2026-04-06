import express from "express";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getStats,
} from "../controllers/Exservicesupport.js";

const router = express.Router();

// ── PUBLIC (veteran submits ticket — no auth needed) ──────────────────────────
router.post("/", createTicket);

// ── ADMIN only ────────────────────────────────────────────────────────────────
// stats MUST come before /:id
router.get("/stats",  protect, adminMiddleware, getStats);
router.get("/",       protect, adminMiddleware, getAllTickets);
router.get("/:id",    protect, adminMiddleware, getTicketById);
router.patch("/:id",  protect, adminMiddleware, updateTicket);
router.delete("/:id", protect, adminMiddleware, deleteTicket);

export default router;