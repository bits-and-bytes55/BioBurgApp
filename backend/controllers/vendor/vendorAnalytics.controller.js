import Order from "../../models/Order.js";

export const getVendorAnalytics = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Total Orders
    const totalOrders = await Order.countDocuments({ vendor: vendorId });

    // Delivered Orders
    const deliveredOrders = await Order.countDocuments({
      vendor: vendorId,
      orderStatus: "DELIVERED",
    });

    // Pending Orders (not delivered)
    const pendingOrders = await Order.countDocuments({
      vendor: vendorId,
      orderStatus: { $ne: "DELIVERED" },
    });

    // Total Sales (only delivered)
    const salesAgg = await Order.aggregate([
      {
        $match: {
          vendor: vendorId,
          orderStatus: "DELIVERED",
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalSales = salesAgg[0]?.totalSales || 0;

    // Orders by status (for chart)
    const ordersByStatus = await Order.aggregate([
      {
        $match: { vendor: vendorId },
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalSales,
        ordersByStatus,
      },
    });
  } catch (error) {
    console.error("Vendor Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor analytics",
    });
  }
};
