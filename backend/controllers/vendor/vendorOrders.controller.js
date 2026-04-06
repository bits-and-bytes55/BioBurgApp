// controllers/vendor/vendorOrders.controller.js
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

// ── Incoming orders on vendor's own products ─────────────────────
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendorProducts = await Product.find({ vendor: vendorId }).select("_id");
    const productIds = vendorProducts.map((p) => p._id);

    if (productIds.length === 0)
      return res.json({ success: true, count: 0, data: [] });

    const orders = await Order.find({
      "items.productId": { $in: productIds },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone")
      .populate("items.productId", "brandName genericName images mrp vendor");

    const vendorOrders = orders.map((order) => {
      const obj = order.toObject();
      obj.items = obj.items.filter((item) =>
        productIds.some((pid) => pid.toString() === item.productId?._id?.toString())
      );
      obj.vendorTotal = obj.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
      );
      return obj;
    });

    res.json({ success: true, count: vendorOrders.length, data: vendorOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Orders placed BY this vendor
export const getVendorPurchases = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const orders = await Order.find({
      $or: [
        { vendorBuyer: vendorId },   
        { userId: vendorId }         
      ]
    })
      .sort({ createdAt: -1 })
      .populate("items.productId", "brandName genericName images mrp");

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── Vendor places an order from the shop ─────────────────────────
export const placeVendorOrder = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { items, shippingAddress, totalAmount } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: "No items provided" });

    // Validate products exist
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== items.length)
      return res.status(400).json({ success: false, message: "One or more products not found" });

    // Build order items with current price
    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      return {
        productId: item.productId,
        quantity:  item.quantity || 1,
        price:     product?.mrp || 0,
        name:      product?.brandName || "",
      };
    });

    const computedTotal = orderItems.reduce(
      (s, i) => s + i.price * i.quantity, 0
    );

    const order = await Order.create({
      vendorBuyer:     vendorId,
      items:           orderItems,
      totalAmount:     computedTotal,
      shippingAddress: shippingAddress || {},
      orderStatus:     "pending",
      paymentStatus:   "pending",
    });

    res.status(201).json({ success: true, message: "Order placed successfully", data: order });
  } catch (err) {
    console.error("Vendor Place Order Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single order ─────────────────────────────────────────────
export const getVendorOrderById = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendorProducts = await Product.find({ vendor: vendorId }).select("_id");
    const productIds = vendorProducts.map((p) => p._id);

    const order = await Order.findOne({
      _id: req.params.id,
      "items.productId": { $in: productIds },
    })
      .populate("userId", "name email phone")
      .populate("items.productId", "brandName genericName images mrp");

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    const obj = order.toObject();
    obj.items = obj.items.filter((item) =>
      productIds.some((pid) => pid.toString() === item.productId?._id?.toString())
    );

    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update order status ──────────────────────────────────────────
export const updateVendorOrderStatus = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { status } = req.body;

    const ALLOWED = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!ALLOWED.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const vendorProducts = await Product.find({ vendor: vendorId }).select("_id");
    const productIds = vendorProducts.map((p) => p._id);

    const order = await Order.findOne({
      _id: req.params.id,
      "items.productId": { $in: productIds },
    });

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found or unauthorized" });

    order.orderStatus = status;
    await order.save();

    res.json({ success: true, message: "Status updated", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};