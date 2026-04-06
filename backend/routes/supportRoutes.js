import express from "express";
import {
  createTicket,
  getMyTickets,
  getTicketById,
  replyToTicket,
  getAllTickets,
  updateTicketStatus,
} from "../controllers/supportController.js";
import franchiseAuth from "../middleware/franchiseAuth.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/", franchiseAuth, createTicket);
router.get("/my", franchiseAuth, getMyTickets);
router.get("/:id", franchiseAuth, getTicketById);
router.post("/:id/reply", franchiseAuth, replyToTicket);

router.get("/", adminProtect, getAllTickets);
router.get("/admin/:id", adminProtect, getTicketById);
router.put("/:id/status", adminProtect, updateTicketStatus);
router.post("/admin/:id/reply", adminProtect, replyToTicket);

export default router;
