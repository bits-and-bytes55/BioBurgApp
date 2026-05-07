import mongoose from "mongoose";

const giftSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    category:    { type: String, enum: ["Promotional", "Festive", "Medical", "Stationery", "Electronics", "Other"], default: "Promotional" },
    description: { type: String, default: "" },
    image:       { url: { type: String, default: "" }, public_id: { type: String, default: "" } },
    totalQuantity:     { type: Number, default: 0 },
    availableQuantity: { type: Number, default: 0 },
    value:   { type: Number, default: 0 },   // ₹ per unit
    status:  { type: String, enum: ["Active", "Inactive"], default: "Active" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "MarketingAgent" },
  },
  { timestamps: true }
);

// Virtual: stock status
giftSchema.virtual("stockStatus").get(function () {
  if (this.availableQuantity === 0)   return "Out of Stock";
  if (this.availableQuantity <= 5)    return "Low Stock";
  return "In Stock";
});

giftSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Gift", giftSchema);