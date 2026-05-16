// backend/routes/calendarEvent.js
import express from "express";
import {
  getEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  deleteEventsByDate,
} from "../controllers/calendarController.js";

import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";


const router = express.Router();
router.get("/events/upcoming", protectAgent, requireAgentPermission("calendar"), getUpcomingEvents);
router.get("/events", protectAgent, requireAgentPermission("calendar"), getEvents);

router.post("/events", protectAgent, requireAgentPermission("calendar"), createEvent);

router.put("/events/:id", protectAgent, requireAgentPermission("calendar"), updateEvent);
router.delete("/events/:id", protectAgent, requireAgentPermission("calendar"), deleteEvent);

router.delete("/events/date/:date", protectAgent, requireAgentPermission("calendar"), deleteEventsByDate);


export default router;