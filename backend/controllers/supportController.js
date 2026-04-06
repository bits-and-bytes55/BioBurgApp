import mongoose from "mongoose";
import Order from "../models/Order.js";
import SupportTicket from "../models/SupportTicket.js";

const isFranchiseTicketOwner = (ticket, franchise) =>
  String(ticket.franchiseId?._id || ticket.franchiseId) ===
  String(franchise?._id);

const normalizeSearchValue = (value) => String(value || "").trim().toLowerCase();
const getZoneObjectId = (zoneId) => {
  if (!zoneId) {
    return null;
  }

  const normalizedValue = String(zoneId?._id || zoneId);

  if (!mongoose.isValidObjectId(normalizedValue)) {
    return null;
  }

  return new mongoose.Types.ObjectId(normalizedValue);
};

export const createTicket = async (req, res) => {
  try {
    const { subject, category, message, orderId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject & message required",
      });
    }

    const ticketData = {
      franchiseId: req.franchise._id,
      subject,
      category,
      message,
    };

    if (orderId && orderId.trim() !== "") {
      if (!mongoose.isValidObjectId(orderId.trim())) {
        return res.status(400).json({
          message: "Invalid linked order id",
        });
      }

      const zoneObjectId = getZoneObjectId(req.franchise?.zoneId);

      if (!zoneObjectId) {
        return res.status(400).json({
          message: "Franchise zone not assigned",
        });
      }

      const linkedOrder = await Order.findOne({
        _id: orderId.trim(),
        zoneId: zoneObjectId,
      }).select("_id orderStatus");

      if (!linkedOrder) {
        return res.status(400).json({
          message: "Linked order is not available for your franchise zone",
        });
      }

      ticketData.orderId = orderId.trim();
    }

    const ticket = await SupportTicket.create(ticketData);

    res.status(201).json({
      success: true,
      message: "Support ticket created",
      ticket,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({
      message: "Failed to create ticket",
    });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const { status, category, search, from, to } = req.query;
    const filter = {
      franchiseId: req.franchise._id,
    };

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (category && category !== "ALL") {
      filter.category = category;
    }

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        filter.createdAt.$gte = new Date(from);
      }

      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .populate("orderId", "_id orderStatus totalAmount paymentMode paymentStatus createdAt");

    const normalizedSearch = normalizeSearchValue(search);
    const filteredTickets = normalizedSearch
      ? tickets.filter((ticket) =>
          [
            ticket.subject,
            ticket.category,
            ticket.message,
            ticket.orderId?._id,
            ticket.orderId?.orderStatus,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : tickets;

    const summary = filteredTickets.reduce(
      (accumulator, ticket) => {
        accumulator.total += 1;
        accumulator[ticket.status] = (accumulator[ticket.status] || 0) + 1;
        accumulator.categories[ticket.category] =
          (accumulator.categories[ticket.category] || 0) + 1;
        return accumulator;
      },
      {
        total: 0,
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        categories: {},
      },
    );

    res.json({
      success: true,
      count: filteredTickets.length,
      summary,
      filtersApplied: {
        status: status || "ALL",
        category: category || "ALL",
        search: search || "",
        from: from || "",
        to: to || "",
      },
      tickets: filteredTickets,
    });
  } catch (error) {
    console.error("Get Tickets Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate(
        "orderId",
        "_id orderStatus totalAmount paymentMode paymentStatus createdAt address",
      )
      .populate("franchiseId", "email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (req.franchise && !req.admin && !isFranchiseTicketOwner(ticket, req.franchise)) {
      return res.status(403).json({ message: "Unauthorized ticket access" });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    console.error("Get Ticket Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Reply message required" });
    }

    const ticket = await SupportTicket.findById(id).populate("franchiseId", "email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (req.franchise && !req.admin && !isFranchiseTicketOwner(ticket, req.franchise)) {
      return res.status(403).json({ message: "Unauthorized ticket access" });
    }

    const sender = req.admin ? "ADMIN" : "FRANCHISE";

    ticket.replies.push({
      sender,
      message: message.trim(),
    });

    if (ticket.status === "OPEN") {
      ticket.status = "IN_PROGRESS";
    } else if (sender === "FRANCHISE" && ticket.status === "RESOLVED") {
      ticket.status = "IN_PROGRESS";
    }

    await ticket.save();

    res.json({
      success: true,
      message: "Reply sent successfully",
      ticket,
    });
  } catch (err) {
    console.error("Reply Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .sort({ createdAt: -1 })
      .populate("franchiseId", "email")
      .populate("orderId", "_id orderStatus totalAmount paymentMode paymentStatus createdAt");

    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Admin Tickets Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = status;
    await ticket.save();

    res.json({
      success: true,
      message: "Status updated",
      ticket,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
