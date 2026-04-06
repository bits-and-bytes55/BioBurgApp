import ExServiceSupport from "../models/Exservicesupport.js";

// ── PUBLIC: Veteran submits a ticket ─────────────────────────────────────────
// POST /api/exservice-support
export const createTicket = async (req, res) => {
  try {
    const { name, email, phone, category, subject, message, source, zone } = req.body;

    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({ success: false, message: "name, email, category, subject, message are required" });
    }

    const ticket = await ExServiceSupport.create({
      name, email, phone, category, subject, message,
      source: source || "ExService Careers Page",
      zone:   zone   || "Jobs & ExService",
    });

    return res.status(201).json({
      success:  true,
      message:  "Support ticket created successfully",
      ticketId: ticket._id,
      data:     ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Get all tickets (with optional filters) ────────────────────────────
// GET /api/exservice-support
export const getAllTickets = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status)   query.status   = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: "i" } },
        { email:    { $regex: search, $options: "i" } },
        { subject:  { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await ExServiceSupport.countDocuments(query);
    const tickets = await ExServiceSupport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: tickets, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Get single ticket ──────────────────────────────────────────────────
// GET /api/exservice-support/:id
export const getTicketById = async (req, res) => {
  try {
    const ticket = await ExServiceSupport.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Update ticket status / priority / note ─────────────────────────────
// PATCH /api/exservice-support/:id
export const updateTicket = async (req, res) => {
  try {
    const { status, priority, adminNote, assignedTo } = req.body;
    const update = {};

    if (status)     update.status     = status;
    if (priority)   update.priority   = priority;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (assignedTo) update.assignedTo = assignedTo;
    if (status === "resolved") update.resolvedAt = new Date();

    const ticket = await ExServiceSupport.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    res.json({ success: true, message: "Ticket updated", data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Delete ticket ──────────────────────────────────────────────────────
// DELETE /api/exservice-support/:id
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await ExServiceSupport.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, message: "Ticket deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Stats summary ──────────────────────────────────────────────────────
// GET /api/exservice-support/stats
export const getStats = async (req, res) => {
  try {
    const [open, in_progress, resolved, closed, total] = await Promise.all([
      ExServiceSupport.countDocuments({ status: "open" }),
      ExServiceSupport.countDocuments({ status: "in_progress" }),
      ExServiceSupport.countDocuments({ status: "resolved" }),
      ExServiceSupport.countDocuments({ status: "closed" }),
      ExServiceSupport.countDocuments(),
    ]);
    res.json({ success: true, data: { open, in_progress, resolved, closed, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};