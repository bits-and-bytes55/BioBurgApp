import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendOrderStatusEmail } from "../utils/emailService.js";

/**
 * GET /api/admin/orders/d2c
 * Returns ALL orders (NORMAL + PRESCRIPTION) with user info populated.
 * Query params: ?status=&search=&page=&limit=
 */
export const getAllD2COrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.orderStatus = status.toUpperCase();
    }

    let orders = await Order.find(filter)
      .populate("userId", "name username email")
      .populate("items.productId", "brandName name images price")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Apply search filter (by user name/email or order ID)
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter((o) => {
        const user = o.userId;
        return (
          o._id.toString().toLowerCase().includes(q) ||
          user?.name?.toLowerCase().includes(q) ||
          user?.username?.toLowerCase().includes(q) ||
          user?.email?.toLowerCase().includes(q)
        );
      });
    }

    const total = await Order.countDocuments(filter);

    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/orders/d2c/stats
 * Quick stats for the dashboard header cards.
 */
export const getD2COrderStats = async (req, res) => {
  try {
    const [total, pending, delivered, revenueAgg] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({
        orderStatus: {
          $in: ["PLACED", "PRESCRIPTION_UPLOADED", "UNDER_REVIEW", "APPROVED", "CONFIRMED", "PROCESSING"],
        },
      }),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        delivered,
        revenue: revenueAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/orders/d2c/:id
 * Single order detail.
 */
export const getD2COrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name username email")
      .populate("items.productId", "brandName name images price");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/admin/orders/d2c/:id/status
 * Update order status + append to trackingHistory + send email to user.
 */
export const updateD2COrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const order = await Order.findById(req.params.id).populate("userId", "name username email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Update status
    order.orderStatus = status.toUpperCase();

    // Append to tracking history
    order.trackingHistory.push({
      status: status.toUpperCase(),
      note: note || "",
      time: new Date(),
    });

    // Set deliveredAt if delivered
    if (status.toUpperCase() === "DELIVERED") {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Send email to user
    try {
      const user = order.userId;
      if (user?.email) {
        await sendOrderStatusEmail({
          toEmail: user.email,
          userName: user.name || user.username || "Customer",
          orderId: order._id,
          status: status.toUpperCase(),
        });
      }
    } catch (emailErr) {
      console.error("Email send failed (non-critical):", emailErr.message);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status} and email sent to customer.`,
      order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};