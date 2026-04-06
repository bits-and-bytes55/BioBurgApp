import mongoose from "mongoose";

const pharmacyDashboardSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      unique: true,
      index: true,
    },

    // Core dashboard sections (Mixed allows any shape)
    inventory:     { type: mongoose.Schema.Types.Mixed, default: [] },
    billing:       { type: mongoose.Schema.Types.Mixed, default: [] },
    suppliers:     { type: mongoose.Schema.Types.Mixed, default: [] },
    purchases:     { type: mongoose.Schema.Types.Mixed, default: [] },
    customers:     { type: mongoose.Schema.Types.Mixed, default: [] },
    prescriptions: { type: mongoose.Schema.Types.Mixed, default: [] },
    staff:         { type: mongoose.Schema.Types.Mixed, default: [] },

    // Backward-compat field names (kept so old data doesn't break)
    orders:    { type: mongoose.Schema.Types.Mixed, default: [] },
    medicines: { type: mongoose.Schema.Types.Mixed, default: [] },
    expiring:  { type: mongoose.Schema.Types.Mixed, default: [] },
    expiry:    { type: mongoose.Schema.Types.Mixed, default: [] },
    returns:   { type: mongoose.Schema.Types.Mixed, default: [] },

    // Section-level timestamps (optional, for admin tracking)
    inventoryUpdatedAt:     { type: Date },
    billingUpdatedAt:       { type: Date },
    suppliersUpdatedAt:     { type: Date },
    customersUpdatedAt:     { type: Date },
    purchasesUpdatedAt:     { type: Date },
    prescriptionsUpdatedAt: { type: Date },
    staffUpdatedAt:         { type: Date },
  },
  { timestamps: true, strict: false }
);

const PharmacyDashboard = mongoose.model("PharmacyDashboard", pharmacyDashboardSchema);
export default PharmacyDashboard;