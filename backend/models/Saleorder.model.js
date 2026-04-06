import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String, required: true },
  brandName:   String,
  category:    String,
  mrp:         { type: Number, required: true },
  price:       { type: Number, required: true },
  qty:         { type: Number, required: true, min: 1 },
  discount:    { type: Number, default: 0 },
  total:       { type: Number, required: true }
});

const saleOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },

    agent: { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
    agentName: String,

    /* customer / recipient */
    customerName:   { type: String, required: true },
    customerPhone:  String,
    customerAddress: String,
    customerGST:    String,

    /* order details */
    orderType: {
      type: String,
      enum: ["bill", "challan", "quotation"],
      default: "bill"
    },
    items: [orderItemSchema],

    subtotal:      { type: Number, default: 0 },
    discountAmt:   { type: Number, default: 0 },
    taxAmt:        { type: Number, default: 0 },
    taxPercent:    { type: Number, default: 0 },
    grandTotal:    { type: Number, default: 0 },

    paymentMode:   { type: String, enum: ["cash", "upi", "credit", "cheque", "online", "other"], default: "cash" },
    paymentStatus: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
    paidAmount:    { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["draft", "confirmed", "dispatched", "delivered", "cancelled"],
      default: "confirmed"
    },

    notes: String,
    visitArea: String,
    visitAddress: String,
  },
  { timestamps: true }
);

/* auto-generate order number before save */
saleOrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("SaleOrder").countDocuments();
    const type  = this.orderType === "bill" ? "BL" : this.orderType === "challan" ? "CH" : "QT";
    this.orderNumber = `${type}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

export default mongoose.model("SaleOrder", saleOrderSchema);