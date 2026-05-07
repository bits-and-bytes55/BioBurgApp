import mongoose from "mongoose";

const saleOrderItemSchema = new mongoose.Schema({
  productId:   { type: String },
  productName: { type: String, required: true },
  brandName:   { type: String, default: "" },
  category:    { type: String, default: "" },
  mrp:         { type: Number, default: 0 },
  price:       { type: Number, required: true },
  qty:         { type: Number, required: true, min: 1 },
  discount:    { type: Number, default: 0 },
  total:       { type: Number, required: true },
}, { _id: false });

const paymentLedgerSchema = new mongoose.Schema({
  amount:      { type: Number, required: true },
  mode:        { type: String, default: "cash" },
  note:        { type: String, default: "" },
  recordedAt:  { type: Date, default: Date.now },
  recordedBy:  { type: String, default: "agent" },
}, { _id: true });

const saleOrderSchema = new mongoose.Schema({
  // Identity
  orderNumber:   { type: String, unique: true },
  orderType:     { type: String, enum: ["bill", "challan", "quotation"], default: "bill" },

  // Agent ref
  agentId:       { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent", required: true },
  agentName:     { type: String, default: "" },

  // Customer
  customerName:    { type: String, required: true },
  customerPhone:   { type: String, default: "" },
  customerAddress: { type: String, default: "" },
  customerGST:     { type: String, default: "" },
  visitArea:       { type: String, default: "" },

  // Items
  items:        { type: [saleOrderItemSchema], default: [] },

  // Pricing
  subtotal:     { type: Number, default: 0 },
  discountAmt:  { type: Number, default: 0 },
  taxPercent:   { type: Number, default: 0 },
  taxAmt:       { type: Number, default: 0 },
  grandTotal:   { type: Number, default: 0 },

  // Payment
  paymentMode:    { type: String, default: "cash" },
  paymentStatus:  { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
  paidAmount:     { type: Number, default: 0 },
  dueAmount:      { type: Number, default: 0 },

  // Payment ledger (history of each payment received)
  paymentLedger:  { type: [paymentLedgerSchema], default: [] },

  // Notes
  notes:        { type: String, default: "" },

  // Invoice meta
  invoiceDate:   { type: Date, default: Date.now },
  dueDate:       { type: Date },
  isVoid:        { type: Boolean, default: false },
  voidReason:    { type: String, default: "" },
}, { timestamps: true });

// Auto-generate order number before save
saleOrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const prefix =
      this.orderType === "bill"      ? "INV" :
      this.orderType === "challan"   ? "DCH" : "QUO";
    const count = await mongoose.model("SaleOrder").countDocuments();
    const pad   = String(count + 1).padStart(5, "0");
    const year  = new Date().getFullYear().toString().slice(-2);
    this.orderNumber = `BB-${prefix}-${year}-${pad}`;
  }
  // Sync dueAmount
  this.dueAmount = Math.max(0, this.grandTotal - this.paidAmount);
  next();
});

export default mongoose.model("SaleOrder", saleOrderSchema);