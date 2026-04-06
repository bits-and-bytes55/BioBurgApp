import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const totalOrders = await Order.countDocuments({ vendor: vendorId });

    const deliveredOrders = await Order.countDocuments({
      vendor: vendorId,
      orderStatus: "DELIVERED",
    });

    const totalProducts = await Product.countDocuments({
      vendor: vendorId,
    });

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

    const recentOrders = await Order.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderStatus totalAmount createdAt");

    const ordersByStatus = await Order.aggregate([
      { $match: { vendor: vendorId } },
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
        totalProducts,
        totalSales,
        ordersByStatus,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Vendor Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};
