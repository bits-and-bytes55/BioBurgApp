// backend/controllers/calendarController.js
import CalendarEvent from "../models/calendarEvent.js";
import { getIO } from "../config/socket.js"; 

const broadcastCalendarUpdate = (payload) => {
  try {
    const io = getIO();
    // Emit on a shared channel so agents receive real-time updates
    io.emit("calendar:updated", payload);
  } catch (_) {
    // socket might not be initialised in test env – fail silently
  }
};

// GET /api/calendar/events?year=2026&month=4
export const getEvents = async (req, res) => {
  try {
    const { year, month, startDate, endDate } = req.query;

    let filter = {};

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (year && month) {
      const paddedMonth = String(month).padStart(2, "0");
      filter.date = { $regex: `^${year}-${paddedMonth}` };
    }

    const events = await CalendarEvent.find(filter).sort({ date: 1, createdAt: 1 });

    // Group by date: { "2026-04-23": [{...}, {...}] }
    const grouped = {};
    events.forEach((ev) => {
      if (!grouped[ev.date]) grouped[ev.date] = [];
      grouped[ev.date].push({
        _id:            ev._id,
        title:          ev.title,
        type:           ev.type,
        description:    ev.description,
        date:           ev.date,
        isAdminCreated: ev.isAdminCreated,
        isPinned:       ev.isPinned,
        createdAt:      ev.createdAt,
      });
    });

    res.status(200).json({ success: true, data: grouped, total: events.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/calendar/events/upcoming?limit=6
export const getUpcomingEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const today = new Date().toISOString().slice(0, 10);

    const events = await CalendarEvent.find({ date: { $gte: today } })
      .sort({ isPinned: -1, date: 1, createdAt: 1 })
      .limit(limit);

    res.status(200).json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/calendar/events
export const createEvent = async (req, res) => {
  try {
    const { title, type, date, description, isAdminCreated, isPinned, followUpId } = req.body;

    if (!title || !type || !date) {
      return res.status(400).json({ success: false, message: "title, type and date are required" });
    }

    const event = await CalendarEvent.create({
      title:          title.trim(),
      type,
      date,
      description:    description?.trim() || "",
      isAdminCreated: isAdminCreated ?? false,
      isPinned:       isPinned ?? false,
      followUpId:     followUpId || null,
      createdBy:      req.user?._id || null,
    });

    // Broadcast real-time update
    broadcastCalendarUpdate({ action: "created", event });

    res.status(201).json({ success: true, data: event, message: "Event created" });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/calendar/events/:id
export const updateEvent = async (req, res) => {
  try {
    const { title, type, date, description, isPinned } = req.body;

    const event = await CalendarEvent.findById(req.params.id);
    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });

    if (title !== undefined)       event.title       = title.trim();
    if (type !== undefined)        event.type        = type;
    if (date !== undefined)        event.date        = date;
    if (description !== undefined) event.description = description.trim();
    if (isPinned !== undefined)    event.isPinned    = isPinned;

    await event.save();

    broadcastCalendarUpdate({ action: "updated", event });

    res.status(200).json({ success: true, data: event, message: "Event updated" });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/calendar/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });

    broadcastCalendarUpdate({ action: "deleted", eventId: req.params.id, date: event.date });

    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/calendar/events/date/:date  — removes ALL events on a date
export const deleteEventsByDate = async (req, res) => {
  try {
    const result = await CalendarEvent.deleteMany({ date: req.params.date });

    broadcastCalendarUpdate({ action: "deletedByDate", date: req.params.date });

    res.status(200).json({ success: true, message: `${result.deletedCount} event(s) deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};