// utils/getPriceForRole.js

const ROLE_DISCOUNT_MAP = {
  customer:     "discountB2C",
  b2c:          "discountB2C",
  b2b:          "discountB2B",
  hospital:     "discountHospital",
  pharmacy:     "discountPharmacy",
  wholesale:    "discountWholesale",
  vendor:       "discountVendor",
  franchise:    "discountFranchise",
  manufacturer: "discountManufacturer",
  admin:        "discountB2C", // admins see B2C price
};

// Pre-computed rate fields stored in DB
const ROLE_RATE_MAP = {
  customer:     "rateB2C",
  b2c:          "rateB2C",
  b2b:          "rateB2B",
  hospital:     "rateHospital",
  pharmacy:     "ratePharmacy",
  wholesale:    "rateWholesale",
  vendor:       "rateVendor",
  franchise:    "rateFranchise",
  manufacturer: "rateManufacturer",
  admin:        "rateB2C",
};

// Also check legacy / alternate field names stored in product
const ROLE_LEGACY_RATE_MAP = {
  customer:     ["saleRatePTR", "ptr"],
  b2c:          ["saleRatePTR", "ptr"],
  b2b:          ["b2bRate"],
  hospital:     ["hospitalSaleRate", "hpsr", "saleRateHPSR"],
  pharmacy:     ["pharmacySaleRate"],
  wholesale:    ["wholesaleSaleRate", "wsr"],
  vendor:       ["vendorRate"],
  franchise:    ["franchiseRate"],
  manufacturer: ["manufacturerRate"],
  admin:        ["saleRatePTR", "ptr"],
};

// B2C customer price — used for comparison in B2BPricingBanner
const getCustomerPrice = (product) => {
  const mrp = Number(product.mrp) || 0;
  const stored = Number(product.rateB2C) || Number(product.saleRatePTR) || Number(product.ptr) || 0;
  if (stored > 0) return stored;
  const disc = Number(product.discountB2C) || 0;
  return Number((mrp * (1 - disc / 100)).toFixed(2));
};

const getPriceForRole = (product, userRole) => {
  const mrp = Number(product.mrp) || 0;

  // ── Normalize role: lowercase + trim, handle null/undefined ──
  const role = (userRole || "customer").toLowerCase().trim();

  // ── 1. Try pre-computed rate field ──
  const rateField = ROLE_RATE_MAP[role] || "rateB2C";
  const storedRate = Number(product[rateField]) || 0;

  if (storedRate > 0) {
    const saving = mrp - storedRate;
    const discPct = mrp > 0 ? (saving / mrp) * 100 : 0;
    return {
      role,
      finalRate: Number(storedRate.toFixed(2)),
      discountPercent: Number(discPct.toFixed(2)),
      saving: Number(saving.toFixed(2)),
      mrp: Number(mrp.toFixed(2)),
      customerPrice: getCustomerPrice(product),
    };
  }

  // ── 2. Try legacy / alternate field names ──
  const legacyFields = ROLE_LEGACY_RATE_MAP[role] || [];
  for (const field of legacyFields) {
    const legacyRate = Number(product[field]) || 0;
    if (legacyRate > 0) {
      const saving = mrp - legacyRate;
      const discPct = mrp > 0 ? (saving / mrp) * 100 : 0;
      return {
        role,
        finalRate: Number(legacyRate.toFixed(2)),
        discountPercent: Number(discPct.toFixed(2)),
        saving: Number(saving.toFixed(2)),
        mrp: Number(mrp.toFixed(2)),
        customerPrice: getCustomerPrice(product),
      };
    }
  }

  // ── 3. Fall back: compute from discount percentage ──
  const discountField = ROLE_DISCOUNT_MAP[role] || "discountB2C";
  const discountPercent = Number(product[discountField]) || 0;
  const finalRate = mrp > 0 ? mrp * (1 - discountPercent / 100) : 0;

  return {
    role, // FIX: was missing in original fallback path
    finalRate: Number(finalRate.toFixed(2)),
    discountPercent: Number(discountPercent.toFixed(2)),
    saving: Number((mrp - finalRate).toFixed(2)),
    mrp: Number(mrp.toFixed(2)),
    customerPrice: getCustomerPrice(product),
  };
};

export default getPriceForRole;