import Vendor from "../../../models/Product.js";
import Order from "../../../models/Order.js";
import mongoose from "mongoose";

export const getAdminVendorDashboard = async (req, res) => {
  try {
    const totalVendors = await Vendor.countDocuments({ role: "vendor" });
    const approvedVendors = await Vendor.countDocuments({
      role: "vendor",
      isApproved: true,
    });
    const blockedVendors = await Vendor.countDocuments({
      role: "vendor",
      isApproved: false,
    });

    const totalOrders = await Order.countDocuments({
      vendor: { $exists: true },
    });

    const revenueAgg = await Order.aggregate([
      {
        $match: {
          vendor: { $exists: true },
          orderStatus: "DELIVERED",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.revenue || 0;
    const topVendors = await Order.aggregate([
      { $match: { vendor: { $exists: true } } },
      {
        $group: {
          _id: "$vendor",
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$orderStatus", "DELIVERED"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $project: {
          vendorName: "$vendor.businessName",
          email: "$vendor.email",
          orders: 1,
          revenue: 1,
        },
      },
    ]);
    const monthlyOrders = await Order.aggregate([
      { $match: { vendor: { $exists: true } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalVendors,
          approvedVendors,
          blockedVendors,
          totalOrders,
          totalRevenue,
        },
        topVendors,
        monthlyOrders,
      },
    });
  } catch (err) {
    console.error("Admin Vendor Dashboard Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load vendor dashboard",
    });
  }
};
