// controllers/vendor/vendorPayments.controller.js
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import VendorPayout from "../../models/VendorPayout.js";

export const getVendorPayments = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // All vendor products
    const vendorProducts = await Product.find({ vendor: vendorId }).select("_id");
    const productIds = vendorProducts.map((p) => p._id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        data: { totalEarnings: 0, paidAmount: 0, pendingAmount: 0, totalOrders: 0, payouts: [] },
      });
    }

    // Delivered orders containing vendor's products
    const deliveredOrders = await Order.find({
      "items.productId": { $in: productIds },
      orderStatus: "delivered",
    })
      .populate("items.productId", "vendor brandName")
      .sort({ updatedAt: -1 });

    // Compute per-order vendor earnings
    let totalEarnings = 0;
    const orderBreakdown = deliveredOrders.map((order) => {
      const vendorItems = order.items.filter((item) =>
        productIds.some((pid) => pid.toString() === item.productId?._id?.toString())
      );
      const amount = vendorItems.reduce(
        (s, item) => s + (item.price || 0) * (item.quantity || 1), 0
      );
      totalEarnings += amount;
      return { orderId: order._id, amount, date: order.updatedAt || order.createdAt };
    });

    // Payout history
    const payouts = await VendorPayout.find({ vendor: vendorId }).sort({ createdAt: -1 });

    const paidAmount = payouts
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.amount, 0);

    const pendingAmount = Math.max(totalEarnings - paidAmount, 0);

    res.json({
      success: true,
      data: {
        totalEarnings,
        paidAmount,
        pendingAmount,
        totalOrders: deliveredOrders.length,
        orderBreakdown,
        payouts,
      },
    });
  } catch (err) {
    console.error("Vendor Payments Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};