import Vendor from "../../../models/Vendor.js";
import Product from "../../../models/Product.js";
import Order from "../../../models/Order.js";

/* -------- PENDING VENDORS -------- */
export const getPendingVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({
      role: "vendor",
      isApproved: false,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch pending vendors" });
  }
};

/* -------- APPROVED VENDORS -------- */
export const getApprovedVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({
      role: "vendor",
      isApproved: true,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch approved vendors" });
  }
};

/* -------- APPROVE / BLOCK VENDOR -------- */
export const updateVendorStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { isApproved } = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { isApproved },
      { new: true }
    );

    res.json({
      success: true,
      message: "Vendor status updated",
      data: vendor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update vendor" });
  }
};

/* -------- VENDOR DETAILS -------- */
export const getVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const totalProducts = await Product.countDocuments({ vendor: vendorId });
    const totalOrders = await Order.countDocuments({ vendor: vendorId });

    const revenueAgg = await Order.aggregate([
      { $match: { vendor: vendor._id, orderStatus: "DELIVERED" } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      success: true,
      data: {
        vendor,
        stats: {
          totalProducts,
          totalOrders,
          revenue: revenueAgg[0]?.revenue || 0,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch vendor details" });
  }
};
