import Order from "../models/Order.js";

export const getOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Placed", "Confirmed", "Processing",
      "Shipped", "Out for Delivery", "Delivered", "Cancelled"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updateData = {
      orderStatus: status,
      $push: {
        orderStatusHistory: {
          status,
          timestamp: new Date(),
        },
      },
    };

    // When order reaches "Processing" → make invoice available to user
    if (status === "Processing") {
      updateData.invoiceReady = true;
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true })
      .populate("userId", "name email phone")
      .populate("items.productId", "brandName title genericName images price");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("items.productId", "brandName title genericName images price ptr mrp");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
  } catch (err) {
    console.error("GET ORDER BY ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};