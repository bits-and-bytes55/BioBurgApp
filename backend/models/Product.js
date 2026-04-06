// models/Product.js
import mongoose from "mongoose";

// ─── Sub-schemas ───────────────────────────────────────────────────────────────

const VariantSchema = new mongoose.Schema(
  { name: String, price: Number, stock: Number, image: { url: String, public_id: String } },
  { _id: false }
);
const SpecSchema       = new mongoose.Schema({ key: String, value: String }, { _id: false });
const ImageSchema      = new mongoose.Schema({ url: String, public_id: String }, { _id: false });
const OfferSchema      = new mongoose.Schema({ text: String, flashing: Boolean, userType: { type: String, default: "all" } }, { _id: false });
const DoctorFeedbackSchema = new mongoose.Schema({ feedback: String, doctor: String, date: String }, { _id: false });

const ReviewMediaSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, default: "" }, resourceType: { type: String, enum: ["image","video"], default: "image" } },
  { _id: false }
);

const ReviewSchema = new mongoose.Schema(
  {
    user:     { type: String, required: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, default: "" },
    date:     { type: String, default: () => new Date().toISOString().split("T")[0] },
    verified: { type: Boolean, default: false },
    thumbsUp: { type: Number, default: 0 },
    thumbsDown: { type: Number, default: 0 },
    media:    { type: [ReviewMediaSchema], default: [] },
  },
  { _id: true, timestamps: true }
);

const CouponSchema = new mongoose.Schema(
  {
    code:       { type: String, required: true },
    type:       { type: String, enum: ["percent","flat"], default: "percent" },
    discount:   { type: Number, required: true },
    minOrder:   { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    expiryDate: { type: String, default: null },
    roles:      { type: [String], default: [] },
    active:     { type: Boolean, default: true },
  },
  { _id: true }
);

const CombinationSchema = new mongoose.Schema(
  {
    attributes: { type: Map, of: String, default: {} },
    price:      { type: Number, default: 0 },
    stock:      { type: Number, default: 0 },
    sku:        { type: String, default: "" },
    image:      { url: String, public_id: String },
  },
  { _id: true }
);

const AuthorSchema = new mongoose.Schema(
  {
    role:             { type: String, default: "Written By" },
    name:             String,
    designation:      String,
    imageUrl:         String,
    about:            String,
    linkedin:         String,
    experience_years: String,
    education:  [{ degree: String, institution: String, year: String }],
    experience: [{ role: String, organization: String, period: String }],
  },
  { _id: false }
);

const ComboProductRefSchema = new mongoose.Schema(
  {
    _id:       { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    brandName: String,
    mrp:       String,
    images:    [{ url: String, public_id: String }],
  },
  { _id: false }
);

const RecommendationSchema = new mongoose.Schema(
  {
    label:       { type: String, required: true },
    description: { type: String, default: "" },
    image:       { url: { type: String, default: "" }, public_id: { type: String, default: "" } },
  },
  { _id: true }
);

const CertificationSchema = new mongoose.Schema(
  {
    label:    { type: String, required: true },
    issuedBy: { type: String, default: "" },
    year:     { type: String, default: "" },
    image:    { url: { type: String, default: "" }, public_id: { type: String, default: "" } },
  },
  { _id: true }
);

const ComboSchema = new mongoose.Schema(
  {
    id:         { type: String },
    name:       { type: String, default: "" },
    products:   [ComboProductRefSchema],
    comboPrice: { type: String, default: "" },
    active:     { type: Boolean, default: true },
  },
  { _id: true }
);

// ─── Main schema ───────────────────────────────────────────────────────────────

const ProductSchema = new mongoose.Schema(
  {
    vendor:        { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: false },
    homeSections:  { type: [String], default: [] },
    recommendations: { type: [RecommendationSchema], default: [] },
    certifications:  { type: [CertificationSchema],  default: [] },

    manufacturer:         { type: String, default: "" },
    brandName:            { type: String, default: "" },
    genericName:          { type: String, default: "" },
    genericCompositions:  { type: String, default: "" },
    hsn:                  { type: String, default: "" },
    batchNumber:          { type: String, default: "" },

    totalStocks:    { type: Number, default: 0 },
    stocks:         { type: Number, default: 0 },
    productWeight:  { type: Number, default: 0 },
    packagingType:  { type: String, default: "" },
    packageType:    { type: String, default: "" },
    caseBoxPackage: { type: String, default: "" },
    casePackPrice:  { type: Number, default: 0 },
    injectionTypes: { type: [String], default: [] },
    tabletTypes:    { type: [String], default: [] },

    dateOfEffect:   { type: String, default: "" },
    batchDateEffect:{ type: String, default: "" },
    expiryDate:     { type: String, default: "" },

    minRateFixed:   { type: Number, default: 0 },
    mrp:            { type: Number, default: 0 },
    amp:            { type: Number, default: 0 },

    // PTR / B2C aliases
    ptr:            { type: Number, default: 0 },
    saleRatePTR:    { type: Number, default: 0 },

    // WSR aliases
    wsr:              { type: Number, default: 0 },
    wholesaleSaleRate:{ type: Number, default: 0 },

    // HPSR aliases
    hpsr:            { type: Number, default: 0 },
    saleRateHPSR:    { type: Number, default: 0 },
    hospitalSaleRate:{ type: Number, default: 0 },

    pharmacySaleRate:  { type: Number, default: 0 },
    vendorRate:        { type: Number, default: 0 },
    franchiseRate:     { type: Number, default: 0 },
    manufacturerRate:  { type: Number, default: 0 },

    totalCostOfStores:      { type: Number, default: 0 },
    totalActualValue:       { type: Number, default: 0 },
    totalSaleValue:         { type: Number, default: 0 },
    totalBusinessSaleValue: { type: Number, default: 0 },
    totalWholesaleValue:    { type: Number, default: 0 },

    // Discounts — both naming conventions stored
    discountB2C:            { type: Number, default: 0 },
    b2cDiscount:            { type: Number, default: 0 },
    discountB2B:            { type: Number, default: 0 },
    b2bDiscount:            { type: Number, default: 0 },
    discountHospital:       { type: Number, default: 0 },
    hospitalPharmacyDiscount:{ type: Number, default: 0 },
    discountPharmacy:       { type: Number, default: 0 },
    discountWholesale:      { type: Number, default: 0 },
    discountVendor:         { type: Number, default: 0 },
    discountFranchise:      { type: Number, default: 0 },
    discountManufacturer:   { type: Number, default: 0 },

    // Computed role rates
    rateB2C:          { type: Number, default: 0 },
    rateB2B:          { type: Number, default: 0 },
    rateHospital:     { type: Number, default: 0 },
    ratePharmacy:     { type: Number, default: 0 },
    rateWholesale:    { type: Number, default: 0 },
    rateVendor:       { type: Number, default: 0 },
    rateFranchise:    { type: Number, default: 0 },
    rateManufacturer: { type: Number, default: 0 },

    // GST — nested object AND flat fields so both work
    gst: {
      igst: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
    },
    gst_igst:     { type: Number, default: 0 },
    gst_cgst:     { type: Number, default: 0 },
    gst_sgst:     { type: Number, default: 0 },
    gstDateEffect:{ type: String, default: "" },

    offersWithIcon:   { type: [OfferSchema], default: [] },
    additionalOffers: { type: String, default: "" },
    scheme1:          { type: String, default: "" },
    scheme2:          { type: String, default: "" },
    coupons:          { type: [CouponSchema], default: [] },

    tags:             { type: [String], default: [] },
    showInCategories: { type: [Boolean], default: [] },
    categories: {
      cat1: { type: Boolean, default: false },
      cat2: { type: Boolean, default: false },
      cat3: { type: Boolean, default: false },
      cat4: { type: Boolean, default: false },
      cat5: { type: Boolean, default: false },
      cat6: { type: Boolean, default: false },
      cat7: { type: Boolean, default: false },
      cat8: { type: Boolean, default: false },
      cat9: { type: Boolean, default: false },
    },
    sections:      { type: [String], default: [] },

    franchiseZoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", default: null, index: true },
    bulkManufacturingAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "BulkManufacturingAccount", default: null, index: true },
    manufacturerAccountId:      { type: mongoose.Schema.Types.ObjectId, ref: "Manufacturer",             default: null, index: true },

    // Descriptions — both naming conventions stored
    description:      { type: String, default: "" },
    moreInformation:  { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    fullDescription:  { type: String, default: "" },
    disclaimer:       { type: String, default: "" },

    // Status — both naming conventions
    currentStatus1: { type: String, default: "active" },
    currentStatus2: { type: String, default: "appear" },
    statusActive:   { type: String, default: "active" },
    statusAppear:   { type: String, default: "appear" },
    isOTC:          { type: Boolean, default: true },

    productRating: { type: Number, default: 0 },
    rating:        { type: Number, default: 0 },
    thumbsUp:      { type: Number, default: 0 },
    thumbsDown:    { type: Number, default: 0 },
    voters: [
      {
        userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type:    { type: String, enum: ["up","down"] },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      },
    ],
    topReviewFromIndia: { type: String, default: "" },
    doctorFeedbacks:    { type: [DoctorFeedbackSchema], default: [] },
    reviews:            { type: [ReviewSchema], default: [] },
    authors:            { type: [AuthorSchema], default: [] },
    marketerName:       { type: String, default: "" },
    marketerAddress:    { type: String, default: "" },
    countryOfOrigin:    { type: String, default: "" },
    lastUpdated:        { type: String, default: "" },

    variants:      { type: [VariantSchema],     default: [] },
    combinations:  { type: [CombinationSchema], default: [] },
    combos:        { type: [ComboSchema],        default: [] },
    specifications:{ type: [SpecSchema],         default: [] },

    images: { type: [ImageSchema], default: [] },
    video:  { url: { type: String, default: "" }, public_id: { type: String, default: "" } },

    qrCodeToken:   { type: String, unique: true, sparse: true, index: true },
    qrCodeUrl:     { type: String, default: "" },
    qrGeneratedAt: { type: Date,   default: null },

    category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },

    autoDateTime: { type: String, default: "" },
  },
  { timestamps: true }
);

// ─── syncLegacyAliases ────────────────────────────────────────────────────────
// Sync duplicate field pairs so both naming conventions stay consistent.

const syncLegacyAliases = (p) => {
  if (!p) return;

  // genericName ↔ genericCompositions
  if (!p.genericName        && p.genericCompositions) p.genericName        = p.genericCompositions;
  if (!p.genericCompositions && p.genericName)         p.genericCompositions = p.genericName;

  // packagingType ↔ packageType
  if (!p.packagingType && p.packageType) p.packagingType = p.packageType;
  if (!p.packageType && p.packagingType) p.packageType   = p.packagingType;

  // batchDateEffect ↔ dateOfEffect
  if (!p.batchDateEffect && p.dateOfEffect) p.batchDateEffect = p.dateOfEffect;
  if (!p.dateOfEffect && p.batchDateEffect) p.dateOfEffect    = p.batchDateEffect;

  // discountB2C ↔ b2cDiscount  (use >= 0 check to allow 0 values)
  if (p.discountB2C == null && p.b2cDiscount != null) p.discountB2C = p.b2cDiscount;
  if (p.b2cDiscount == null && p.discountB2C != null) p.b2cDiscount = p.discountB2C;

  // discountB2B ↔ b2bDiscount
  if (p.discountB2B == null && p.b2bDiscount != null) p.discountB2B = p.b2bDiscount;
  if (p.b2bDiscount == null && p.discountB2B != null) p.b2bDiscount = p.discountB2B;

  // discountHospital ↔ hospitalPharmacyDiscount
  if (!p.discountHospital          && p.hospitalPharmacyDiscount) p.discountHospital          = p.hospitalPharmacyDiscount;
  if (!p.hospitalPharmacyDiscount  && p.discountHospital)         p.hospitalPharmacyDiscount  = p.discountHospital;

  // description ↔ fullDescription
  if (!p.description    && p.fullDescription) p.description    = p.fullDescription;
  if (!p.fullDescription && p.description)    p.fullDescription = p.description;

  // moreInformation ↔ shortDescription
  if (!p.moreInformation  && p.shortDescription) p.moreInformation  = p.shortDescription;
  if (!p.shortDescription && p.moreInformation)  p.shortDescription = p.moreInformation;

  // currentStatus1 ↔ statusActive
  if (!p.currentStatus1 && p.statusActive)  p.currentStatus1 = p.statusActive;
  if (!p.statusActive   && p.currentStatus1) p.statusActive   = p.currentStatus1;

  // currentStatus2 ↔ statusAppear
  if (!p.currentStatus2 && p.statusAppear)  p.currentStatus2 = p.statusAppear;
  if (!p.statusAppear   && p.currentStatus2) p.statusAppear   = p.currentStatus2;

  // productRating ↔ rating
  if (!p.productRating && p.rating)        p.productRating = p.rating;
  if (!p.rating        && p.productRating) p.rating        = p.productRating;
};

// ─── calculateRateForSave ─────────────────────────────────────────────────────
// Priority order:
//   1. Explicit rate > 0                    → use it
//   2. mrp > 0 AND discountPct > 0          → derive from MRP
//   3. Keep stored value (NEVER return 0)   → prevents zeroing stored rates

const calculateRateForSave = (mrp, discountPct, explicitRate, storedRate) => {
  const numMrp      = Number(mrp)          || 0;
  const numExplicit = Number(explicitRate) || 0;
  const numDiscount = Number(discountPct)  || 0;
  const numStored   = Number(storedRate)   || 0;

  // 1. Explicit rate wins
  if (numExplicit > 0) return numExplicit;

  // 2. Derive from MRP × discount if both provided
  if (numMrp > 0 && numDiscount > 0) return Math.max(0, numMrp - (numMrp * numDiscount) / 100);

  // 3. Keep stored value — do NOT fall through to 0
  return numStored;
};

// ─── pre("save") ──────────────────────────────────────────────────────────────

ProductSchema.pre("save", function (next) {
  syncLegacyAliases(this);

  // Stock sync
  if (this.variants?.length > 0) {
    this.stocks      = this.variants.reduce((s, v) => s + (v.stock || 0), 0);
    this.totalStocks = this.stocks;
  } else if (this.isNew && !this.stocks) {
    this.stocks = this.totalStocks || 0;
  }

  const mrp = Number(this.mrp) || 0;

  // Snapshot ALL explicit rate fields BEFORE writing any of them
  const explicitB2C      = Number(this.saleRatePTR)       || Number(this.ptr)          || 0;
  const explicitB2B      = Number(this.rateB2B)            || 0;
  const explicitHospital = Number(this.hospitalSaleRate)   || Number(this.hpsr)         || Number(this.saleRateHPSR) || 0;
  const explicitPharmacy = Number(this.pharmacySaleRate)   || 0;
  const explicitWholesale= Number(this.wholesaleSaleRate)  || Number(this.wsr)          || 0;
  const explicitVendor   = Number(this.vendorRate)         || 0;
  const explicitFranchise= Number(this.franchiseRate)      || 0;
  const explicitMfr      = Number(this.manufacturerRate)   || 0;

  // Snapshot discount fields
  const discB2C       = Number(this.discountB2C)       || Number(this.b2cDiscount)       || 0;
  const discB2B       = Number(this.discountB2B)       || Number(this.b2bDiscount)       || 0;
  const discHospital  = Number(this.discountHospital)  || Number(this.hospitalPharmacyDiscount) || 0;
  const discPharmacy  = Number(this.discountPharmacy)  || 0;
  const discWholesale = Number(this.discountWholesale) || 0;
  const discVendor    = Number(this.discountVendor)    || 0;
  const discFranchise = Number(this.discountFranchise) || 0;
  const discMfr       = Number(this.discountManufacturer) || 0;

  // Snapshot stored rates (what's already in DB for this doc)
  const storedB2C       = Number(this.rateB2C)          || 0;
  const storedB2B       = Number(this.rateB2B)          || 0;
  const storedHospital  = Number(this.rateHospital)     || 0;
  const storedPharmacy  = Number(this.ratePharmacy)     || 0;
  const storedWholesale = Number(this.rateWholesale)    || 0;
  const storedVendor    = Number(this.rateVendor)       || 0;
  const storedFranchise = Number(this.rateFranchise)    || 0;
  const storedMfr       = Number(this.rateManufacturer) || 0;

  // Compute rates using 3-priority logic
  this.rateB2C          = calculateRateForSave(mrp, discB2C,       explicitB2C,       storedB2C);
  this.rateB2B          = calculateRateForSave(mrp, discB2B,       explicitB2B,       storedB2B);
  this.rateHospital     = calculateRateForSave(mrp, discHospital,  explicitHospital,  storedHospital);
  this.ratePharmacy     = calculateRateForSave(mrp, discPharmacy,  explicitPharmacy,  storedPharmacy);
  this.rateWholesale    = calculateRateForSave(mrp, discWholesale, explicitWholesale, storedWholesale);
  this.rateVendor       = calculateRateForSave(mrp, discVendor,    explicitVendor,    storedVendor);
  this.rateFranchise    = calculateRateForSave(mrp, discFranchise, explicitFranchise, storedFranchise);
  this.rateManufacturer = calculateRateForSave(mrp, discMfr,       explicitMfr,       storedMfr);

  // Keep alias fields in sync with computed rates
  this.ptr             = this.rateB2C;
  this.saleRatePTR     = this.rateB2C;
  this.wsr             = this.rateWholesale;
  this.wholesaleSaleRate = this.rateWholesale;
  this.hpsr            = this.rateHospital;
  this.saleRateHPSR    = this.rateHospital;
  this.hospitalSaleRate= this.rateHospital;
  this.pharmacySaleRate= this.ratePharmacy;
  this.vendorRate      = this.rateVendor;
  this.franchiseRate   = this.rateFranchise;
  this.manufacturerRate= this.rateManufacturer;

  // Sync discount aliases
  this.b2cDiscount             = this.discountB2C;
  this.b2bDiscount             = this.discountB2B;
  this.hospitalPharmacyDiscount= this.discountHospital;

  // Sync GST nested ↔ flat
  if (this.gst_igst && !this.gst?.igst) {
    this.gst = { igst: this.gst_igst, cgst: this.gst_cgst || 0, sgst: this.gst_sgst || 0 };
  } else if (this.gst?.igst && !this.gst_igst) {
    this.gst_igst = this.gst.igst;
    this.gst_cgst = this.gst.cgst || 0;
    this.gst_sgst = this.gst.sgst || 0;
  }
  // Keep both in sync
  if (this.gst?.igst) {
    this.gst_igst = this.gst_igst || this.gst.igst;
    this.gst_cgst = this.gst_cgst || this.gst.cgst || 0;
    this.gst_sgst = this.gst_sgst || this.gst.sgst || 0;
  }
  if (this.gst_igst) {
    if (!this.gst) this.gst = {};
    this.gst.igst = this.gst.igst || this.gst_igst;
    this.gst.cgst = this.gst.cgst || this.gst_cgst || 0;
    this.gst.sgst = this.gst.sgst || this.gst_sgst || 0;
  }

  next();
});

// ─── pre("findOneAndUpdate") — same 3-priority logic ─────────────────────────

ProductSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (!update) return next();
  syncLegacyAliases(update);

  const mrp = Number(update.mrp) || 0;
  if (!mrp) return next();

  const calcU = (expl, disc, stored) => {
    const e = Number(expl)   || 0;
    const d = Number(disc)   || 0;
    const s = Number(stored) || 0;
    if (e > 0) return e;
    if (mrp > 0 && d > 0) return Math.max(0, mrp - (mrp * d) / 100);
    return s;
  };

  update.rateB2C          = calcU(update.saleRatePTR || update.ptr,           update.discountB2C || update.b2cDiscount,           update.rateB2C);
  update.rateB2B          = calcU(update.rateB2B,                             update.discountB2B || update.b2bDiscount,           update.rateB2B);
  update.rateHospital     = calcU(update.hospitalSaleRate || update.hpsr,     update.discountHospital,                            update.rateHospital);
  update.ratePharmacy     = calcU(update.pharmacySaleRate,                    update.discountPharmacy,                            update.ratePharmacy);
  update.rateWholesale    = calcU(update.wholesaleSaleRate || update.wsr,     update.discountWholesale,                           update.rateWholesale);
  update.rateVendor       = calcU(update.vendorRate,                          update.discountVendor,                              update.rateVendor);
  update.rateFranchise    = calcU(update.franchiseRate,                       update.discountFranchise,                           update.rateFranchise);
  update.rateManufacturer = calcU(update.manufacturerRate,                    update.discountManufacturer,                        update.rateManufacturer);

  update.ptr              = update.rateB2C;
  update.saleRatePTR      = update.rateB2C;
  update.wsr              = update.rateWholesale;
  update.wholesaleSaleRate= update.rateWholesale;
  update.hpsr             = update.rateHospital;
  update.saleRateHPSR     = update.rateHospital;
  update.hospitalSaleRate = update.rateHospital;
  update.pharmacySaleRate = update.ratePharmacy;
  update.vendorRate       = update.rateVendor;
  update.franchiseRate    = update.rateFranchise;
  update.manufacturerRate = update.rateManufacturer;

  next();
});

// ─── Instance method ──────────────────────────────────────────────────────────

ProductSchema.methods.updateRating = async function () {
  if (!this.reviews?.length) return;
  const avg = this.reviews.reduce((s, r) => s + (r.rating || 0), 0) / this.reviews.length;
  this.rating        = Math.round(avg * 10) / 10;
  this.productRating = this.rating;
  await this.save();
};

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);