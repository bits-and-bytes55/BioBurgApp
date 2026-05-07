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

const router = express.Router();

router.get("/events/upcoming", getUpcomingEvents);   
router.get("/events",          getEvents);

router.post("/events", createEvent);

router.put   ("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

router.delete("/events/date/:date", deleteEventsByDate);

export default router;