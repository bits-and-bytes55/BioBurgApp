import mongoose from "mongoose";

/* ---------- Order Item ---------- */
const orderItemSchema = new mongoose.Schema(
  {
    productId:    { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity:     { type: Number, default: 1 },
    price:        { type: Number, default: 0 },
    priceAtAdded: { type: Number, default: 0 },
    name:         { type: String },

    mrp:             { type: Number, default: null },   
    batchNumber:     { type: String, default: null },  
    hsn:             { type: String, default: null },   
    gst_igst:        { type: Number, default: null },  
    gst_cgst:        { type: Number, default: null },   
    gst_sgst:        { type: Number, default: null },  
    discountPercent: { type: Number, default: null },  
    manufacturer:    { type: String, default: null },  
    genericName:     { type: String, default: null },   
  },
  { _id: false },
);

/* ---------- Status History ---------- */
const orderStatusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note:      { type: String },
  },
  { _id: false },
);

/* ---------- Main Order ---------- */
const orderSchema = new mongoose.Schema(
  {
    /* ── USER ── */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },

    orderId: { type: String, unique: true, sparse: true, index: true },

    /* ── VENDOR ── */
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: false, default: null },
    vendorBuyer: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },

    /* ── ZONE ── */
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", default: null },
    bulkManufacturingAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkManufacturingAccount",
      default: null,
    },
    manufacturerAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manufacturer",
      default: null,
    },
    fulfilmentOwnerType: {
      type: String,
      enum: ["GENERAL", "FRANCHISE", "BULK_MANUFACTURING", "MANUFACTURER"],
      default: "GENERAL",
    },

    /* ── ORDER TYPE ── */
    orderType: { type: String, enum: ["NORMAL", "PRESCRIPTION"], default: "NORMAL" },

    /* ── ITEMS ── */
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },

    /* ── PRESCRIPTION ── */
    prescription: { url: String, publicId: String },

    /* ── PAYMENT ── */
    paymentMode:       { type: String, enum: ["COD", "ONLINE"] },
    paymentStatus:     { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },

    /* ── ORDER STATUS ── */
    orderStatus: {
      type: String,
      enum: [
        "PRESCRIPTION_UPLOADED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PRESCRIPTION_DELETED",
        "PLACED", "ACCEPTED", "PACKED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
        "CANCELLED", "RETURN_REQUESTED", "REPLACE_REQUESTED",
      ],
      default: "PLACED",
    },
    orderStatusHistory: [orderStatusHistorySchema],

    /* ── TRACKING ── */
    trackingHistory: [
      {
        status: String,
        time:   { type: Date, default: Date.now },
        note:   { type: String },
      },
    ],

    /* ── INVOICE ── */
    invoiceNumber: { type: String },
    invoiceReady:  { type: Boolean, default: false },

    /* ── CANCEL / RETURN / REPLACE ── */
    cancelReason:  { type: String },
    returnReason:  { type: String },
    replaceReason: { type: String },

    /* ── DISCOUNT / COUPON ── */
    couponCode:     { type: String },
    discountAmount: { type: Number, default: 0 },

    /* ── DELIVERY ── */
    deliveryAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "assigned", "picked", "in-transit", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryCharge:   { type: Number, default: 30 },
    deliveryPayout: { type: Number, default: 0 }, 
    deliveredAt:      { type: Date },

    /* ── NEW: delivery pipeline & assignment metadata ── */
    isQueued:         { type: Boolean, default: false },  
    deliveryLocation: { type: String,  default: "" },      
    deliveryType:     {                                     
      type: String,
      enum: ["pickup", "delivery"],
      default: "delivery",
    },

    /* ── ADDRESS (snapshot at order time) ── */
    address: {
      fullName:    String,
      phone:       String,
      addressLine: String,
      city:        String,
      state:       String,
      pincode:     String,
    },
  },
  { timestamps: true },
);

/* ── Indexes ── */
orderSchema.index({ userId:        1, createdAt: -1 });
orderSchema.index({ orderStatus:   1 });
orderSchema.index({ deliveryAgent: 1, deliveryStatus: 1 });
orderSchema.index({ bulkManufacturingAccountId: 1, createdAt: -1 });
orderSchema.index({ manufacturerAccountId: 1, createdAt: -1 });
orderSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
export default mongoose.model("Order", orderSchema);
