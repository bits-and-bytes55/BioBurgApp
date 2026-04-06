import Order from "../models/Order.js";
import { emitOrderUpdate } from "../config/socket.js";
import { ORDER_STATUS } from "../utils/orderStatus.js";

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = status;
    order.trackingHistory.push({ status });

    await order.save();

    // 🔥 REAL-TIME UPDATE
    emitOrderUpdate(orderId, {
      orderId,
      status,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc   Assign Zone to Order
 * @route  PUT /api/admin/orders/:orderId/assign-zone
 * @access Admin
 */
export const assignZoneToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { zoneId } = req.body;

    if (!zoneId) {
      return res.status(400).json({ message: "Zone ID required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.zoneId = zoneId;

    // Optional: tracking history
    order.trackingHistory.push({
      status: "ZONE_ASSIGNED"
    });

    await order.save();

    res.json({
      success: true,
      message: "Zone assigned successfully",
      order
    });

  } catch (error) {
    console.error("Assign Zone Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("zoneId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Admin Orders Error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


// controllers/orderAdmin.controller.js

export const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email")
      .populate("zoneId", "name");

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json({
      success: true,
      orderId: order._id,
      status: order.orderStatus,
      trackingHistory: order.trackingHistory,
      user: order.userId,
      zone: order.zoneId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

