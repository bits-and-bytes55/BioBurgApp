// utils/getPriceForRole.js
// Handles: 8 standard roles, MR L1-L14, and dynamic custom roles

// ─── Standard role → DB field maps ───────────────────────────────────────────

const ROLE_RATE_MAP = {
  customer:     "rateB2C",
  b2c:          "rateB2C",
  b2b:          "rateB2B",
  hospital:     "rateHospital",
  pharmacy:     "ratePharmacy",
  wholesale:    "rateWholesale",
  distributor:  "rateWholesale",
  vendor:       "rateVendor",
  franchise:    "rateFranchise",
  manufacturer: "rateManufacturer",
  admin:        "rateB2C",
};

const ROLE_LEGACY_RATE_MAP = {
  customer:     ["saleRatePTR", "ptr"],
  b2c:          ["saleRatePTR", "ptr"],
  b2b:          ["b2bRate"],
  hospital:     ["hospitalSaleRate", "hpsr", "saleRateHPSR"],
  pharmacy:     ["pharmacySaleRate"],
  wholesale:    ["wholesaleSaleRate", "wsr"],
  distributor:  ["wholesaleSaleRate", "wsr"],
  vendor:       ["vendorRate"],
  franchise:    ["franchiseRate"],
  manufacturer: ["manufacturerRate"],
  admin:        ["saleRatePTR", "ptr"],
};

const ROLE_DISCOUNT_MAP = {
  customer:     "discountB2C",
  b2c:          "discountB2C",
  b2b:          "discountB2B",
  hospital:     "discountHospital",
  pharmacy:     "discountPharmacy",
  wholesale:    "discountWholesale",
  distributor:  "discountWholesale",
  vendor:       "discountVendor",
  franchise:    "discountFranchise",
  manufacturer: "discountManufacturer",
  admin:        "discountB2C",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCustomerPrice = (product) => {
  const mrp    = Number(product.mrp) || 0;
  const stored = Number(product.rateB2C) || Number(product.saleRatePTR) || Number(product.ptr) || 0;
  if (stored > 0) return stored;
  const disc = Number(product.discountB2C) || 0;
  return Number((mrp * (1 - disc / 100)).toFixed(2));
};

const buildResult = (role, finalRate, mrp, customerPrice) => {
  const saving   = mrp - finalRate;
  const discPct  = mrp > 0 ? (saving / mrp) * 100 : 0;
  return {
    role,
    finalRate:       Number(finalRate.toFixed(2)),
    discountPercent: Number(discPct.toFixed(2)),
    saving:          Number(saving.toFixed(2)),
    mrp:             Number(mrp.toFixed(2)),
    customerPrice,
  };
};

// ─── Main function ────────────────────────────────────────────────────────────

const getPriceForRole = (product, userRole) => {
  if (!product) {
    return { role: "customer", finalRate: 0, discountPercent: 0, saving: 0, mrp: 0, customerPrice: 0 };
  }

  const mrp          = Number(product.mrp) || 0;
  const role         = (userRole || "customer").toLowerCase().trim();
  const custPrice    = getCustomerPrice(product);

  // ── 1. Marketing Agent levels: "mrl1" … "mrl14" (case-insensitive) ────────
  const mrMatch = role.match(/^mrl?(\d+)$/i);
  if (mrMatch) {
    const lvl      = parseInt(mrMatch[1], 10);
    const rateKey  = `mrL${lvl}Rate`;
    const discKey  = `mrL${lvl}Discount`;
    const stored   = Number(product[rateKey]) || 0;

    if (stored > 0) return buildResult(role, stored, mrp, custPrice);

    // fall back: derive from stored discount %
    const disc = Number(product[discKey]) || 0;
    if (disc > 0 && mrp > 0) return buildResult(role, mrp * (1 - disc / 100), mrp, custPrice);

    // no rate set for this MR level → return MRP (no discount)
    return buildResult(role, mrp, mrp, custPrice);
  }

  // ── 2. Custom roles (stored in product.customRoles array) ─────────────────
  const customRoles = Array.isArray(product.customRoles) ? product.customRoles : [];
  const customRole  = customRoles.find(
    (r) => r?.key?.toLowerCase() === role || r?.rateKey?.toLowerCase() === role + "rate"
  );
  if (customRole) {
    const stored = Number(customRole.rate) || 0;
    if (stored > 0) return buildResult(role, stored, mrp, custPrice);

    const disc = Number(customRole.discount) || 0;
    if (disc > 0 && mrp > 0) return buildResult(role, mrp * (1 - disc / 100), mrp, custPrice);

    return buildResult(role, mrp, mrp, custPrice);
  }

  // ── 3. Pre-computed rate field (standard roles) ────────────────────────────
  const rateField  = ROLE_RATE_MAP[role] || "rateB2C";
  const storedRate = Number(product[rateField]) || 0;
  if (storedRate > 0) return buildResult(role, storedRate, mrp, custPrice);

  // ── 4. Legacy / alternate field names ─────────────────────────────────────
  const legacyFields = ROLE_LEGACY_RATE_MAP[role] || [];
  for (const field of legacyFields) {
    const legacyRate = Number(product[field]) || 0;
    if (legacyRate > 0) return buildResult(role, legacyRate, mrp, custPrice);
  }

  // ── 5. Fall back: compute from discount percentage ─────────────────────────
  const discountField   = ROLE_DISCOUNT_MAP[role] || "discountB2C";
  const discountPercent = Number(product[discountField]) || 0;
  const finalRate       = mrp > 0 && discountPercent > 0
    ? mrp * (1 - discountPercent / 100)
    : mrp; // no discount found → return MRP

  return buildResult(role, finalRate, mrp, custPrice);
};

export default getPriceForRole;