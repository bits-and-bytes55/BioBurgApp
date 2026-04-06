import Cart from "../models/Cart.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../utils/orderStatus.js";
import DeliveryAgent from "../models/DeliveryAgent.js";
import Earning from "../models/Earning.js";

/* ── Shared populate config — invoice needs these fields ─────── */
const PRODUCT_POPULATE = {
  path: "items.productId",
  select:
    "brandName title genericName genericCompositions manufacturer " +
    "hsn batchNumber mrp saleRatePTR rateB2C " +
    "gst_igst gst_cgst gst_sgst franchiseZoneId bulkManufacturingAccountId manufacturerAccountId " +
    "discountB2C expiryDate images price ptr",
};

const normalizeObjectId = (value) => {
  if (!value) return "";
  return String(value._id || value);
};

const resolveFranchiseZoneForProducts = (products = []) => {
  const mappedZones = products.map((product) =>
    normalizeObjectId(product?.franchiseZoneId)
  );
  const assignedZones = mappedZones.filter(Boolean);

  if (assignedZones.length === 0) {
    return { zoneId: null };
  }

  const uniqueZones = [...new Set(assignedZones)];
  const hasUnassignedProducts = mappedZones.length !== assignedZones.length;

  if (uniqueZones.length > 1 || hasUnassignedProducts) {
    return {
      error:
        "Your cart contains products mapped to different franchise fulfilment owners. Please place separate orders for each franchise product group.",
    };
  }

  return { zoneId: uniqueZones[0] };
};

const resolveBulkManufacturingOwnerForProducts = (products = []) => {
  const mappedAccounts = products.map((product) =>
    normalizeObjectId(product?.bulkManufacturingAccountId)
  );
  const assignedAccounts = mappedAccounts.filter(Boolean);

  if (assignedAccounts.length === 0) {
    return { bulkManufacturingAccountId: null };
  }

  const uniqueAccounts = [...new Set(assignedAccounts)];
  const hasUnassignedProducts = mappedAccounts.length !== assignedAccounts.length;

  if (uniqueAccounts.length > 1 || hasUnassignedProducts) {
    return {
      error:
        "Your cart contains products mapped to different bulk manufacturing owners. Please place separate orders for each bulk-manufacturing product group.",
    };
  }

  return { bulkManufacturingAccountId: uniqueAccounts[0] };
};

const resolveManufacturerOwnerForProducts = (products = []) => {
  const mappedAccounts = products.map((product) =>
    normalizeObjectId(product?.manufacturerAccountId)
  );
  const assignedAccounts = mappedAccounts.filter(Boolean);

  if (assignedAccounts.length === 0) {
    return { manufacturerAccountId: null };
  }

  const uniqueAccounts = [...new Set(assignedAccounts)];
  const hasUnassignedProducts = mappedAccounts.length !== assignedAccounts.length;

  if (uniqueAccounts.length > 1 || hasUnassignedProducts) {
    return {
      error:
        "Your cart contains products mapped to different manufacturer owners. Please place separate orders for each manufacturer product group.",
    };
  }

  return { manufacturerAccountId: uniqueAccounts[0] };
};

const resolveFulfilmentOwnershipForProducts = (products = []) => {
  const franchiseZoneResolution = resolveFranchiseZoneForProducts(products);
  if (franchiseZoneResolution.error) {
    return franchiseZoneResolution;
  }

  const bulkOwnerResolution = resolveBulkManufacturingOwnerForProducts(products);
  if (bulkOwnerResolution.error) {
    return bulkOwnerResolution;
  }

  const manufacturerOwnerResolution =
    resolveManufacturerOwnerForProducts(products);
  if (manufacturerOwnerResolution.error) {
    return manufacturerOwnerResolution;
  }

  const activeOwnerCount = [
    franchiseZoneResolution.zoneId,
    bulkOwnerResolution.bulkManufacturingAccountId,
    manufacturerOwnerResolution.manufacturerAccountId,
  ].filter(Boolean).length;

  if (activeOwnerCount > 1) {
    return {
      error:
        "Your cart contains products mapped to different fulfilment owners. Please place separate orders for each owner group.",
    };
  }

  return {
    zoneId: franchiseZoneResolution.zoneId || null,
    bulkManufacturingAccountId:
      bulkOwnerResolution.bulkManufacturingAccountId || null,
    manufacturerAccountId:
      manufacturerOwnerResolution.manufacturerAccountId || null,
    fulfilmentOwnerType: franchiseZoneResolution.zoneId
      ? "FRANCHISE"
      : bulkOwnerResolution.bulkManufacturingAccountId
        ? "BULK_MANUFACTURING"
        : manufacturerOwnerResolution.manufacturerAccountId
          ? "MANUFACTURER"
        : "GENERAL",
  };
};


export const placeOrder = async (req, res) => {
  try {
    const { paymentMode, address, guestItems, isGuest } = req.body;

    if (!paymentMode || !address) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    let orderItems = [];
    let totalAmount = 0;
    let orderZoneId = null;
    let bulkManufacturingAccountId = null;
    let manufacturerAccountId = null;
    let fulfilmentOwnerType = "GENERAL";

    if (req.user) {
      // ── LOGGED IN: use server-side cart ──
      const cart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      orderItems = cart.items.map((item) => {
        const prod = item.productId;
        totalAmount += item.quantity * item.priceAtAdded;
        return {
          productId:    prod._id,
          quantity:     item.quantity,
          price:        item.priceAtAdded,
          priceAtAdded: item.priceAtAdded,
          name:         prod.brandName || prod.title,
          mrp:          prod.mrp ?? null,
          batchNumber:  prod.batchNumber ?? null,
          hsn:          prod.hsn ?? null,
          gst_igst:     prod.gst_igst ?? null,
          gst_cgst:     prod.gst_cgst ?? null,
          gst_sgst:     prod.gst_sgst ?? null,
          discountPercent: prod.discountB2C ?? null,
          manufacturer: prod.manufacturer ?? null,
          genericName:  prod.genericCompositions ?? null,
        };
      });

      const ownershipResolution = resolveFulfilmentOwnershipForProducts(
        cart.items.map((item) => item.productId).filter(Boolean)
      );
      if (ownershipResolution.error) {
        return res.status(400).json({ message: ownershipResolution.error });
      }
      orderZoneId = ownershipResolution.zoneId;
      bulkManufacturingAccountId =
        ownershipResolution.bulkManufacturingAccountId;
      manufacturerAccountId = ownershipResolution.manufacturerAccountId;
      fulfilmentOwnerType = ownershipResolution.fulfilmentOwnerType;

      // Clear server cart after order
      await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [] } });

    } else {
      // ── GUEST: use items sent from frontend ──
      if (!guestItems || guestItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const resolvedProducts = [];
  for (const item of guestItems) {
    const prodId = item.productId?._id || item.productId;
    const prod = await Product.findById(prodId).lean();
    if (!prod) continue;
    resolvedProducts.push(prod);

    const price = item.priceAtAdded || item.price || prod.mrp || 0;
    totalAmount += item.quantity * price;
    orderItems.push({
      productId:    prod._id,
      quantity:     item.quantity,
      price,
      priceAtAdded: price,
      name:         prod.brandName || prod.title,
      mrp:          prod.mrp    ?? null,
      hsn:          prod.hsn    ?? null,
      gst_igst:     prod.gst_igst ?? null,
      manufacturer: prod.manufacturer ?? null,
      genericName:  prod.genericCompositions ?? null,
    });
  }

  if (orderItems.length === 0) {
    return res.status(400).json({ message: "No valid products found in cart" });
  }

  const ownershipResolution = resolveFulfilmentOwnershipForProducts(
    resolvedProducts
  );
  if (ownershipResolution.error) {
    return res.status(400).json({ message: ownershipResolution.error });
  }
  orderZoneId = ownershipResolution.zoneId;
  bulkManufacturingAccountId =
    ownershipResolution.bulkManufacturingAccountId;
  manufacturerAccountId = ownershipResolution.manufacturerAccountId;
  fulfilmentOwnerType = ownershipResolution.fulfilmentOwnerType;
}

    const order = await Order.create({
      userId:      req.user?.id || null,
      items:       orderItems,
      totalAmount,
      zoneId: orderZoneId,
      bulkManufacturingAccountId,
      manufacturerAccountId,
      fulfilmentOwnerType,
      paymentMode,
      paymentStatus: paymentMode === "COD" ? "PENDING" : "PAID",
      orderStatus:   "PLACED",
      address,
      trackingHistory:    [{ status: "PLACED" }],
      orderStatusHistory: [{ status: "PLACED", timestamp: new Date() }],
    });

    res.status(201).json({ success: true, message: "Order placed successfully", order });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate(PRODUCT_POPULATE);

    res.json({ success: true, orders });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ORDER BY ID
 * ── Added PRODUCT_POPULATE with all invoice fields ──
 */
export const getOrderById = async (req, res) => {
  try {
    const rawId   = req.params.orderId || req.params.id || "";
    const cleanId = decodeURIComponent(rawId).replace(/^#/, "").trim().toUpperCase();

    if (!cleanId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    let order = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);

    if (isObjectId) {
      order = await Order.findById(cleanId)
        .populate(PRODUCT_POPULATE);
    }

    if (!order && /^[0-9A-F]{8}$/i.test(cleanId)) {
      const orders = await Order.find({})
        .select("_id items userId")
        .populate(PRODUCT_POPULATE);
      order = orders.find(o =>
        o._id.toString().slice(-8).toUpperCase() === cleanId.toUpperCase()
      ) || null;
    }

    if (!order) {
      order = await Order.findOne({
        $or: [
          { orderId:       cleanId },
          { orderNumber:   cleanId },
          { invoiceNumber: cleanId },
        ],
      }).populate(PRODUCT_POPULATE);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found. Please check your order number." });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("GET ORDER BY ID ERROR:", error);
    res.status(500).json({ success: false, message: "Server error while fetching order." });
  }
};

/**
 * UPLOAD PRESCRIPTION ORDER — unchanged
 */
export const uploadPrescriptionOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileBase64, address } = req.body;

    if (!fileBase64 || !address) {
      return res.status(400).json({ success: false, message: "Prescription file and address are required" });
    }

    const match = fileBase64.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid base64 file format" });
    }

    const mimeType     = match[1];
    const base64Data   = match[2];
    const fileBuffer   = Buffer.from(base64Data, "base64");
    const resourceType = mimeType.startsWith("image/") ? "image" : "raw";

    const uploadedFile = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "prescriptions", resource_type: resourceType },
          (error, result) => { if (error) return reject(error); resolve(result); }
        )
        .end(fileBuffer);
    });

    const order = await Order.create({
      userId,
      orderType: "PRESCRIPTION",
      prescription: {
        url:      uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
      },
      address,
      totalAmount:        0,
      orderStatus:        "PRESCRIPTION_UPLOADED",
      trackingHistory:    [{ status: "PRESCRIPTION_UPLOADED" }],
      orderStatusHistory: [{ status: "PRESCRIPTION_UPLOADED", timestamp: new Date() }],
    });

    res.status(201).json({ success: true, message: "Prescription uploaded successfully", order });
  } catch (error) {
    console.error("PRESCRIPTION UPLOAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Upload failed" });
  }
};

/**
 * DELETE PRESCRIPTION — unchanged
 */
export const deletePrescription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    if (!order.prescription?.publicId) {
      return res.status(400).json({ success: false, message: "No prescription found to delete" });
    }

    const publicId = order.prescription.publicId;
    await deleteFromCloudinary(publicId, "image");
    await deleteFromCloudinary(publicId, "raw");
    await Order.findByIdAndUpdate(orderId, {
      $unset: { prescription: "" },
      $set:   { orderStatus: "PRESCRIPTION_DELETED" },
      $push:  { trackingHistory: { status: "PRESCRIPTION_DELETED" } },
    });

    res.json({ success: true, message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("DELETE PRESCRIPTION ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN — APPROVE PRESCRIPTION — unchanged
 */
export const adminApprovePrescription = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.orderType !== "PRESCRIPTION") return res.status(400).json({ success: false, message: "Not a prescription order" });
    if (!order.prescription) return res.status(400).json({ success: false, message: "No prescription found" });
    if (["APPROVED", "REJECTED"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Prescription already processed" });
    }

    order.orderStatus = "APPROVED";
    order.trackingHistory.push({ status: "PRESCRIPTION_APPROVED", adminId: req.admin._id });
    order.orderStatusHistory.push({ status: "APPROVED", timestamp: new Date() });
    await order.save();

    res.json({ success: true, message: "Prescription approved", order });
  } catch (error) {
    console.error("ADMIN APPROVE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN — REJECT PRESCRIPTION — unchanged
 */
export const adminRejectPrescription = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.orderType !== "PRESCRIPTION") return res.status(400).json({ success: false, message: "Not a prescription order" });
    if (!order.prescription) return res.status(400).json({ success: false, message: "No prescription found" });
    if (["APPROVED", "REJECTED"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Prescription already processed" });
    }

    order.orderStatus = "REJECTED";
    order.trackingHistory.push({ status: "PRESCRIPTION_REJECTED", reason: reason || "Invalid prescription" });
    order.orderStatusHistory.push({ status: "REJECTED", timestamp: new Date() });
    await order.save();

    res.json({ success: true, message: "Prescription rejected", order });
  } catch (error) {
    console.error("ADMIN REJECT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN — GET ALL ORDERS
 * ── Added PRODUCT_POPULATE ──
 */
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate(PRODUCT_POPULATE)
      .populate("userId",        "name email phone")
      .populate("deliveryAgent", "name agentId phone vehicleType");

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("GET ALL ORDERS ADMIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ADMIN — UPDATE ORDER STATUS — unchanged
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = [
      "PLACED", "CONFIRMED", "PROCESSING",
      "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const update = {
      orderStatus: status,
      $push: {
        orderStatusHistory: { status, timestamp: new Date() },
        trackingHistory:    { status, time: new Date() },
      },
    };

    if (status === "PROCESSING") update.invoiceReady = true;

    const order = await Order.findByIdAndUpdate(id, update, { new: true })
      .populate(PRODUCT_POPULATE)
      .populate("userId", "name email phone");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════
   USER ACTIONS — Cancel / Return / Replace — unchanged
══════════════════════════════════════════════════════ */

const CANCELLABLE_STATUSES = ["PLACED", "CONFIRMED", "PROCESSING"];

export const cancelOrder = async (req, res) => {
  try {
    const userId      = req.user._id || req.user.id;
    const { id }      = req.params;
    const { reason }  = req.body;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!CANCELLABLE_STATUSES.includes(order.orderStatus?.toUpperCase())) {
      return res.status(400).json({
        message: `Cannot cancel an order that is already "${order.orderStatus}". Cancellation is only allowed before Shipped.`,
      });
    }

    order.orderStatus  = "CANCELLED";
    order.cancelReason = reason || "";
    order.orderStatusHistory.push({ status: "CANCELLED", timestamp: new Date(), note: reason });
    order.trackingHistory.push({ status: "CANCELLED", time: new Date(), note: reason });
    await order.save();

    res.status(200).json({ success: true, message: "Order cancelled successfully", order });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const returnOrder = async (req, res) => {
  try {
    const userId     = req.user._id || req.user.id;
    const { id }     = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.orderStatus?.toUpperCase() !== "DELIVERED") {
      return res.status(400).json({ message: "Only delivered orders can be returned." });
    }

    order.orderStatus  = "RETURN_REQUESTED";
    order.returnReason = reason || "";
    order.orderStatusHistory.push({ status: "RETURN_REQUESTED", timestamp: new Date(), note: reason });
    order.trackingHistory.push({ status: "RETURN_REQUESTED", time: new Date(), note: reason });
    await order.save();

    res.status(200).json({ success: true, message: "Return request submitted successfully", order });
  } catch (err) {
    console.error("RETURN ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const replaceOrder = async (req, res) => {
  try {
    const userId     = req.user._id || req.user.id;
    const { id }     = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.orderStatus?.toUpperCase() !== "DELIVERED") {
      return res.status(400).json({ message: "Only delivered orders can be replaced." });
    }

    order.orderStatus   = "REPLACE_REQUESTED";
    order.replaceReason = reason || "";
    order.orderStatusHistory.push({ status: "REPLACE_REQUESTED", timestamp: new Date(), note: reason });
    order.trackingHistory.push({ status: "REPLACE_REQUESTED", time: new Date(), note: reason });
    await order.save();

    res.status(200).json({ success: true, message: "Replacement request submitted successfully", order });
  } catch (err) {
    console.error("REPLACE ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════
   DELIVERY — unchanged
══════════════════════════════════════════════════════ */

export const assignDeliveryAgent = async (req, res) => {
  try {
    const { agentId, orderType, location, customPayout } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) return res.status(404).json({ success: false, message: "Agent not found" });

    const activeOrder = await Order.findOne({
      deliveryAgent:  agentId,
      deliveryStatus: { $in: ["assigned", "picked", "in-transit"] },
      _id:            { $ne: order._id },
    });

    const isQueued = !!activeOrder;

    const commission    = agent.commission ?? 7;
    const calcPayout    = Math.round((order.totalAmount || 0) * commission / 100);
    const finalPayout   = customPayout !== undefined ? Number(customPayout) : calcPayout;

    order.deliveryAgent    = agentId;
    order.deliveryStatus   = "assigned";
    order.deliveryLocation = location || "";
    order.deliveryType     = orderType || "delivery";
    order.isQueued         = isQueued;
    order.deliveryPayout   = finalPayout;

    order.trackingHistory.push({
      status: isQueued
        ? `Queued for ${agent.name} — payout ₹${finalPayout}`
        : `Assigned to ${agent.name} — payout ₹${finalPayout}`,
      note: location || "",
      time: new Date(),
    });

    await order.save();

    res.json({
      success:        true,
      isQueued,
      deliveryPayout: finalPayout,
      message: isQueued
        ? `Order queued for ${agent.name} (payout ₹${finalPayout})`
        : `Order assigned to ${agent.name} (payout ₹${finalPayout})!`,
    });
  } catch (err) {
    console.error("ASSIGN AGENT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus } = req.body;

    const allowed = ["pending", "assigned", "picked", "in-transit", "delivered", "cancelled"];
    if (!allowed.includes(deliveryStatus)) {
      return res.status(400).json({ success: false, message: `Invalid deliveryStatus. Allowed: ${allowed.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.deliveryStatus = deliveryStatus;

    if (deliveryStatus === "delivered") {
      order.deliveredAt  = new Date();
      order.orderStatus  = "DELIVERED";
      order.isQueued     = false;

      order.orderStatusHistory.push({ status: "DELIVERED", timestamp: new Date() });
      order.trackingHistory.push({ status: "delivered", time: new Date() });

      if (order.deliveryAgent) {
        try {
          const agent      = await DeliveryAgent.findById(order.deliveryAgent);
          const commission = agent?.commission ?? 7;
          const amount     = Math.round((order.totalAmount || 0) * commission / 100);

          await Earning.findOneAndUpdate(
            { agent: order.deliveryAgent, order: order._id, type: "Commission" },
            {
              $setOnInsert: {
                agent:     order.deliveryAgent,
                order:     order._id,
                type:      "Commission",
                amount,
                isPaid:    false,
                createdAt: new Date(),
              },
            },
            { upsert: true, new: true }
          );

          await DeliveryAgent.findByIdAndUpdate(order.deliveryAgent, {
            $inc: { totalDeliveries: 1, thisMonthDeliveries: 1 },
          });
        } catch (earningsErr) {
          console.error("Earnings upsert error:", earningsErr);
        }
      }

      if (order.deliveryAgent) {
        const nextQueued = await Order.findOne({
          deliveryAgent:  order.deliveryAgent,
          deliveryStatus: "assigned",
          isQueued:       true,
        }).sort({ createdAt: 1 });

        if (nextQueued) {
          nextQueued.isQueued = false;
          nextQueued.trackingHistory.push({
            status: "Activated from queue — previous delivery complete",
            time:   new Date(),
          });
          await nextQueued.save();
        }
      }
    }

    if (deliveryStatus !== "delivered") {
      order.trackingHistory.push({ status: deliveryStatus, time: new Date() });
    }

    await order.save();

    res.json({ success: true, message: `Delivery status updated to ${deliveryStatus}` });
  } catch (err) {
    console.error("UPDATE DELIVERY STATUS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOrderPayout = async (req, res) => {
  try {
    const { payout } = req.body;

    if (payout === undefined || isNaN(payout)) {
      return res.status(400).json({ success: false, message: "payout amount is required and must be a number" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryPayout: Number(payout) },
      { new: true }
    ).populate("deliveryAgent", "name agentId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.deliveryStatus === "delivered" && order.deliveryAgent) {
      await Earning.findOneAndUpdate(
        { agent: order.deliveryAgent._id, order: order._id, type: "Commission" },
        { amount: Number(payout) },
        { new: true }
      );
    }

    res.json({
      success:        true,
      message:        `Payout updated to ₹${payout} for order #${order._id.toString().slice(-8).toUpperCase()}`,
      deliveryPayout: Number(payout),
      order,
    });
  } catch (err) {
    console.error("UPDATE PAYOUT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const backfillOrderSnapshots = async (req, res) => {
  try {
    const orders = await Order.find({ "items.gst_igst": null })
      .populate("items.productId");

    let updated = 0;

    for (const order of orders) {
      let changed = false;

      for (const item of order.items) {
        const prod = item.productId;
        if (!prod || typeof prod !== "object" || item.gst_igst != null) continue;

        item.mrp             = item.mrp || prod.mrp             || null;
        item.batchNumber     =             prod.batchNumber     || null;
        item.hsn             = item.hsn || prod.hsn             || null;
        item.gst_igst        =             prod.gst_igst        || null;
        item.gst_cgst        =             prod.gst_cgst        || null;
        item.gst_sgst        =             prod.gst_sgst        || null;
        item.discountPercent =             prod.discountB2C     || null;
        item.manufacturer    =             prod.manufacturer    || null;
        item.genericName     =             prod.genericCompositions || null;
        changed = true;
      }

      if (changed) {
        await order.save();
        updated++;
      }
    }

    res.json({ success: true, message: `Backfilled ${updated} orders` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
