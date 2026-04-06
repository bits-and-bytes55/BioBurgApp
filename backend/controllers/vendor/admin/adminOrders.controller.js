import Order from "../../../models/Order.js";

/* ---------------- ALL ORDERS ---------------- */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name phone")
      .populate("vendor", "businessName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/* ---------------- UNASSIGNED ORDERS ---------------- */
export const getUnassignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      vendor: { $exists: false },
    })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch unassigned orders" });
  }
};

/* ---------------- ASSIGNED ORDERS ---------------- */
export const getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      vendor: { $exists: true },
    })
      .populate("userId", "name phone")
      .populate("vendor", "businessName")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch assigned orders" });
  }
};

/* ---------------- ASSIGN ORDER TO VENDOR ---------------- */
export const assignVendorToOrder = async (req, res) => {
  try {
    const { orderId, vendorId } = req.body;

    if (!orderId || !vendorId) {
      return res.status(400).json({
        success: false,
        message: "Order ID & Vendor ID required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        vendor: vendorId,
        orderStatus: "PLACED",
        $push: {
          trackingHistory: {
            status: "VENDOR_ASSIGNED",
            time: new Date(),
          },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Vendor assigned successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to assign vendor" });
  }
};
