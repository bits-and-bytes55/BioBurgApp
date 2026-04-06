import Order from "../../../models/Order.js";
import Vendor from "../../../models/Product.js";
import mongoose from "mongoose";

/* ================= ADMIN → VENDOR ANALYTICS ================= */
export const getAdminVendorAnalytics = async (req, res) => {
  try {
    /* -------- GLOBAL KPIs -------- */
    const totalVendors = await Vendor.countDocuments({ role: "vendor" });

    const vendorOrders = await Order.countDocuments({
      vendor: { $exists: true },
    });

    const revenueAgg = await Order.aggregate([
      { $match: { vendor: { $exists: true }, orderStatus: "DELIVERED" } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.revenue || 0;

    /* -------- VENDOR WISE -------- */
    const vendorWise = await Order.aggregate([
      { $match: { vendor: { $exists: true } } },
      {
        $group: {
          _id: "$vendor",
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0],
            },
          },
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
          vendorId: "$vendor._id",
          vendorName: "$vendor.businessName",
          totalOrders: 1,
          deliveredOrders: 1,
          revenue: 1,
        },
      },
    ]);

    /* -------- MONTHLY REVENUE -------- */
    const monthlyRevenue = await Order.aggregate([
      { $match: { vendor: { $exists: true }, orderStatus: "DELIVERED" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalVendors,
          vendorOrders,
          totalRevenue,
        },
        vendorWise,
        monthlyRevenue,
      },
    });
  } catch (err) {
    console.error("Admin Vendor Analytics Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch vendor analytics" });
  }
};
