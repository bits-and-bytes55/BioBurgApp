import Product from "../../models/Product.js";

export const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user._id; 

    const products = await Product.find({ vendor: vendorId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Vendor Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor products",
    });
  }
};
