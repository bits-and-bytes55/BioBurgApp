import mongoose from "mongoose";
import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";

import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import Category from "../models/categoryModel.js";
import Order from "../models/Order.js";
import Zone from "../models/Zone.js";
import getPriceForRole from "../utils/getPriceForRole.js";
import jwt from "jsonwebtoken";

// ─── Constants ─────────────────────────────────────────────────────────────────

const QR_TOKEN_PREFIX = "BBLS";
const CLOUDINARY_IMAGE_TIMEOUT_MS = Number(process.env.CLOUDINARY_IMAGE_TIMEOUT_MS || 180000);
const CLOUDINARY_VIDEO_TIMEOUT_MS = Number(process.env.CLOUDINARY_VIDEO_TIMEOUT_MS || 420000);
const CLOUDINARY_RETRY_COUNT = Number(process.env.CLOUDINARY_RETRY_COUNT || 2);

// ─── Small utilities ───────────────────────────────────────────────────────────

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const resolveField = (source, keys, fallback) => {
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    if (hasOwn(source, key)) return source[key];
  }
  return fallback;
};

const safeParse = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string") return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true")  return true;
    if (s === "false") return false;
  }
  return Boolean(value);
};

const escapeRegex = (v) => String(v || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const normalizeBaseUrl  = (url) => String(url || "").trim().replace(/\/+$/, "");
const getFrontendBaseUrl = () => normalizeBaseUrl(process.env.FRONTEND_URL || "http://localhost:5173");

// ─── QR helpers ────────────────────────────────────────────────────────────────

const buildProductQrToken = (productId) => `${QR_TOKEN_PREFIX}-${String(productId)}`;
const buildProductQrUrl   = (qrToken)   => `${getFrontendBaseUrl()}/product-qr/${encodeURIComponent(qrToken)}`;

const parseProductIdFromQrToken = (qrToken) => {
  const match = String(qrToken || "").match(
    new RegExp(`^${QR_TOKEN_PREFIX}-([0-9a-fA-F]{24})$`)
  );
  return match ? match[1] : null;
};

// ─── Cloudinary helpers ────────────────────────────────────────────────────────

const readCloudinaryError = (error) => {
  const nested = error?.error || {};
  return {
    httpCode: nested.http_code ?? error?.http_code,
    name:     nested.name     ?? error?.name,
    message:  nested.message  ?? error?.message ?? "Cloudinary upload failed",
  };
};

const isCloudinaryTimeoutError = (error) => {
  const { httpCode, name, message } = readCloudinaryError(error);
  return (
    httpCode === 499 ||
    name === "TimeoutError" ||
    /timeout/i.test(String(message || ""))
  );
};

const uploadWithRetry = async (uploadFn, label, retries = CLOUDINARY_RETRY_COUNT) => {
  let attempt = 0;
  while (attempt <= retries) {
    try { return await uploadFn(); }
    catch (error) {
      const canRetry = isCloudinaryTimeoutError(error) && attempt < retries;
      if (!canRetry) throw error;
      attempt++;
      await wait(700 * attempt);
      console.warn(`[Cloudinary Retry] ${label} retry ${attempt}/${retries}`);
    }
  }
};

const uploadImageToCloudinary = (imageData, folder = "products/images") =>
  uploadWithRetry(
    () => cloudinary.uploader.upload(imageData, {
      folder, resource_type: "image", timeout: CLOUDINARY_IMAGE_TIMEOUT_MS,
    }),
    folder
  );

const uploadVideoToCloudinary = (videoData, folder = "products/videos") =>
  uploadWithRetry(
    () => cloudinary.uploader.upload_large(videoData, {
      folder, resource_type: "video", chunk_size: 6000000, timeout: CLOUDINARY_VIDEO_TIMEOUT_MS,
    }),
    folder,
    Math.max(CLOUDINARY_RETRY_COUNT, 3)
  );

const normalizeAssetObject = (value) => {
  if (!value) return null;
  if (typeof value === "string") return { url: value, public_id: "" };
  const url = value.url || value.secure_url || "";
  if (!url) return null;
  return { url, public_id: value.public_id || value.publicId || "" };
};

const uploadAssetIfNeeded = async (value, folder, resourceType = "image") => {
  if (!value) return null;
  if (Array.isArray(value))    return uploadAssetIfNeeded(value[0], folder, resourceType);
  if (typeof value === "object") return normalizeAssetObject(value);
  if (typeof value === "string" && value.startsWith("data:")) {
    const uploaded = resourceType === "video"
      ? await uploadVideoToCloudinary(value, folder)
      : await uploadImageToCloudinary(value, folder);
    return { url: uploaded.secure_url, public_id: uploaded.public_id };
  }
  if (typeof value === "string") return { url: value, public_id: "" };
  return null;
};

const processImageList = async (value, folder = "products/images") => {
  const rawList = safeParse(value, []);
  if (!Array.isArray(rawList)) return [];
  const processed = [];
  for (const item of rawList) {
    const asset = await uploadAssetIfNeeded(item, folder, "image");
    if (asset?.url) processed.push(asset);
  }
  return processed;
};

const processCombinations = async (value) => {
  const rawList = safeParse(value, []);
  if (!Array.isArray(rawList)) return [];
  const processed = [];
  for (const item of rawList) {
    const c = { ...item };
    if (c.image) c.image = await uploadAssetIfNeeded(c.image, "products/combo-images", "image");
    processed.push(c);
  }
  return processed;
};

const processAuthors = async (value) => {
  const rawList = safeParse(value, []);
  if (!Array.isArray(rawList)) return [];
  const processed = [];
  for (const item of rawList) {
    const a = { ...item };
    if (a.imageUrl && String(a.imageUrl).startsWith("data:")) {
      const r = await uploadImageToCloudinary(a.imageUrl, "authors");
      a.imageUrl = r.secure_url;
    } else if (a.image && String(a.image).startsWith("data:")) {
      const r = await uploadImageToCloudinary(a.image, "authors");
      a.imageUrl = r.secure_url;
      delete a.image;
    }
    processed.push(a);
  }
  return processed;
};

const processRichImageCollection = async (value, folder) => {
  const rawList = safeParse(value, []);
  if (!Array.isArray(rawList)) return [];
  const processed = [];
  for (const item of rawList) {
    const c = { ...item };
    if (c.image) {
      const asset = await uploadAssetIfNeeded(c.image, folder, "image");
      c.image = asset || { url: "", public_id: "" };
    }
    processed.push(c);
  }
  return processed;
};

// ─── Cloudinary destroy helpers ────────────────────────────────────────────────

const destroyImages = async (images = []) => {
  for (const img of images || []) {
    if (img?.public_id) await cloudinary.uploader.destroy(img.public_id).catch(() => {});
  }
};

const destroyVideo = async (video) => {
  if (video?.public_id)
    await cloudinary.uploader.destroy(video.public_id, { resource_type: "video" }).catch(() => {});
};

const destroyRichImages = async (items = []) => {
  for (const item of items || []) {
    if (item?.image?.public_id)
      await cloudinary.uploader.destroy(item.image.public_id).catch(() => {});
  }
};

const destroyVariantImages = async (variants = []) => {
  for (const item of variants || []) {
    if (item?.image?.public_id)
      await cloudinary.uploader.destroy(item.image.public_id).catch(() => {});
  }
};

const destroyReviewMedia = async (reviews = []) => {
  for (const review of reviews || []) {
    for (const media of review?.media || []) {
      const publicId = media?.publicId || media?.public_id;
      if (!publicId) continue;
      await cloudinary.uploader.destroy(publicId, {
        resource_type: media?.resourceType === "video" ? "video" : "image",
      }).catch(() => {});
    }
  }
};

const getPublicIds = (items = [], getter = (item) => item?.public_id) =>
  new Set((items || []).map((item) => getter(item)).filter(Boolean).map(String));

const destroyRemovedImages = async (currentItems = [], nextItems = [], getter = (item) => item?.public_id, destroyer) => {
  const _d = destroyer || ((item) =>
    item?.public_id ? cloudinary.uploader.destroy(item.public_id).catch(() => {}) : Promise.resolve()
  );
  const nextIds = getPublicIds(nextItems, getter);
  for (const item of currentItems || []) {
    const pid = getter(item);
    if (!pid || nextIds.has(String(pid))) continue;
    await _d(item);
  }
};

export const destroyProductAssets = async (product) => {
  if (!product) return;
  await destroyImages(product.images);
  await destroyVideo(product.video);
  await destroyVariantImages(product.variants);
  await destroyVariantImages(product.combinations);
  await destroyRichImages(product.recommendations);
  await destroyRichImages(product.certifications);
  await destroyReviewMedia(product.reviews);
};

export const cleanupChangedProductAssets = async (existingProduct, nextFields = {}, rawData = {}) => {
  if (!existingProduct) return;

  if (hasOwn(rawData, "images"))
    await destroyRemovedImages(existingProduct.images, nextFields.images);

  if (hasOwn(rawData, "video")) {
    const curPid  = existingProduct.video?.public_id;
    const nextPid = nextFields.video?.public_id;
    if (curPid && curPid !== nextPid) await destroyVideo(existingProduct.video);
  }

  const richDestroyer = (field) => (i) =>
    i?.image?.public_id
      ? cloudinary.uploader.destroy(i.image.public_id).catch(() => {})
      : Promise.resolve();

  for (const field of ["variants", "combinations", "recommendations", "certifications"]) {
    if (hasOwn(rawData, field)) {
      await destroyRemovedImages(
        existingProduct[field], nextFields[field],
        (i) => i?.image?.public_id, richDestroyer(field)
      );
    }
  }

  if (hasOwn(rawData, "reviews")) {
    const curMedia  = (existingProduct.reviews || []).flatMap((r) => r?.media || []);
    const nextMedia = (nextFields.reviews    || []).flatMap((r) => r?.media || []);
    await destroyRemovedImages(
      curMedia, nextMedia,
      (i) => i?.publicId || i?.public_id,
      (i) => {
        const pid = i?.publicId || i?.public_id;
        return pid
          ? cloudinary.uploader.destroy(pid, { resource_type: i?.resourceType === "video" ? "video" : "image" }).catch(() => {})
          : Promise.resolve();
      }
    );
  }
};

// ─── Category flag helpers ─────────────────────────────────────────────────────

const buildCategoriesFlags = (showInCategories = [], fallback = {}) => ({
  cat1: showInCategories[0] !== undefined ? !!showInCategories[0] : !!fallback?.cat1,
  cat2: showInCategories[1] !== undefined ? !!showInCategories[1] : !!fallback?.cat2,
  cat3: showInCategories[2] !== undefined ? !!showInCategories[2] : !!fallback?.cat3,
  cat4: showInCategories[3] !== undefined ? !!showInCategories[3] : !!fallback?.cat4,
  cat5: showInCategories[4] !== undefined ? !!showInCategories[4] : !!fallback?.cat5,
  cat6: showInCategories[5] !== undefined ? !!showInCategories[5] : !!fallback?.cat6,
  cat7: showInCategories[6] !== undefined ? !!showInCategories[6] : !!fallback?.cat7,
  cat8: showInCategories[7] !== undefined ? !!showInCategories[7] : !!fallback?.cat8,
  cat9: showInCategories[8] !== undefined ? !!showInCategories[8] : !!fallback?.cat9,
});

const deriveShowInCategories = (categories = {}) =>
  ["cat1","cat2","cat3","cat4","cat5","cat6","cat7","cat8","cat9"].map((k) => !!categories[k]);

// ─── Auth helpers ──────────────────────────────────────────────────────────────

const decodeToken = (req) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;
    return jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch { return null; }
};

const getRequestUser = (req) => req.user || decodeToken(req) || null;
const getRequestRole = (req) => getRequestUser(req)?.role || "customer";

// ─── Vendor / category helpers ─────────────────────────────────────────────────

const resolveVendorId = async (candidate, fallback = null) => {
  if (candidate && mongoose.Types.ObjectId.isValid(String(candidate))) return candidate;
  if (fallback) return fallback;
  const vendor = await Vendor.findOne({}).sort({ createdAt: 1 });
  return vendor?._id || null;
};

const ensureCategoryId = async (value, fieldName = "category") => {
  if (!value || !mongoose.Types.ObjectId.isValid(String(value)))
    throw httpError(400, `Valid ${fieldName} is required`);
  const exists = await Category.exists({ _id: value });
  if (!exists) throw httpError(400, `${fieldName} not found`);
  return value;
};

const ensureSubCategoryId = async (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "" || value === "null") return null;
  if (!mongoose.Types.ObjectId.isValid(String(value))) throw httpError(400, "Invalid subCategory");
  return value;
};

const ensureZoneId = async (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "" || value === "null") return null;
  if (!mongoose.Types.ObjectId.isValid(String(value))) throw httpError(400, "Invalid franchise zone");
  const exists = await Zone.exists({ _id: value });
  if (!exists) throw httpError(400, "Franchise zone not found");
  return value;
};

const findCategoryByIdentifier = async (value) => {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(String(value))) return Category.findById(value);
  return Category.findOne({ title: { $regex: new RegExp(`^${escapeRegex(value)}$`, "i") } });
};

const findProductQuery = (identifier) => {
  const raw = decodeURIComponent(String(identifier || "").trim());
  if (/^[0-9a-fA-F]{24}$/.test(raw)) return { _id: raw };
  return { brandName: { $regex: new RegExp(`^${escapeRegex(raw)}$`, "i") } };
};

const filterCouponsForRole = (coupons = [], userRole = "customer") =>
  (coupons || []).filter((c) => {
    if (!c?.active) return false;
    if (!c.roles || c.roles.length === 0) return true;
    return c.roles.includes(userRole);
  });

// ─── normalizeProductForResponse ──────────────────────────────────────────────

const normalizeProductForResponse = (product, userRole = "customer") => {
  const raw = typeof product?.toObject === "function" ? product.toObject() : { ...(product || {}) };
  const categories     = raw.categories || {};
  const currentStatus1 = raw.currentStatus1 || raw.statusActive  || "active";
  const currentStatus2 = raw.currentStatus2 || raw.statusAppear  || "appear";

  const authors = (raw.authors || []).map((a) => ({
    ...a,
    imageUrl: a.imageUrl || a.image?.url || a.image?.secure_url || "",
  }));

  const recommendations = (raw.recommendations || []).map((item) => ({
    ...item,
    image: {
      url: (typeof item.image === "string" ? item.image : null) || item.image?.url || item.image?.secure_url || "",
      public_id: item.image?.public_id || "",
    },
  }));

  const certifications = (raw.certifications || []).map((item) => ({
    ...item,
    image: {
      url: (typeof item.image === "string" ? item.image : null) || item.image?.url || item.image?.secure_url || "",
      public_id: item.image?.public_id || "",
    },
  }));

  return {
    ...raw,
    genericName:          raw.genericName          || raw.genericCompositions || "",
    genericCompositions:  raw.genericCompositions  || raw.genericName         || "",
    packagingType:        raw.packagingType         || raw.packageType         || "",
    packageType:          raw.packageType           || raw.packagingType       || "",
    batchDateEffect:      raw.batchDateEffect       || raw.dateOfEffect        || "",
    dateOfEffect:         raw.dateOfEffect          || raw.batchDateEffect     || "",
    ptr:                  raw.ptr              ?? raw.saleRatePTR        ?? 0,
    saleRatePTR:          raw.saleRatePTR      ?? raw.ptr                ?? 0,
    wsr:                  raw.wsr              ?? raw.wholesaleSaleRate  ?? 0,
    wholesaleSaleRate:    raw.wholesaleSaleRate ?? raw.wsr               ?? 0,
    hpsr:                 raw.hpsr             ?? raw.hospitalSaleRate   ?? raw.saleRateHPSR ?? 0,
    saleRateHPSR:         raw.saleRateHPSR     ?? raw.hospitalSaleRate  ?? raw.hpsr         ?? 0,
    hospitalSaleRate:     raw.hospitalSaleRate  ?? raw.saleRateHPSR     ?? raw.hpsr         ?? 0,
    b2cDiscount:          raw.b2cDiscount  ?? raw.discountB2C  ?? 0,
    discountB2C:          raw.discountB2C  ?? raw.b2cDiscount  ?? 0,
    b2bDiscount:          raw.b2bDiscount  ?? raw.discountB2B  ?? 0,
    discountB2B:          raw.discountB2B  ?? raw.b2bDiscount  ?? 0,
    hospitalPharmacyDiscount: raw.hospitalPharmacyDiscount ?? raw.discountHospital ?? 0,
    discountHospital:     raw.discountHospital ?? raw.hospitalPharmacyDiscount ?? 0,
    description:          raw.description     || raw.fullDescription    || "",
    moreInformation:      raw.moreInformation || raw.shortDescription   || "",
    fullDescription:      raw.fullDescription || raw.description        || "",
    shortDescription:     raw.shortDescription || raw.moreInformation  || "",
    currentStatus1,
    currentStatus2,
    statusActive:         raw.statusActive || currentStatus1,
    statusAppear:         raw.statusAppear || currentStatus2,
    productRating:        raw.productRating ?? raw.rating        ?? 0,
    rating:               raw.rating        ?? raw.productRating ?? 0,
    tags:                 raw.tags              || [],
    categories,
    showInCategories:     Array.isArray(raw.showInCategories) && raw.showInCategories.length > 0
                            ? raw.showInCategories
                            : deriveShowInCategories(categories),
    sections:             raw.sections       || [],
    homeSections:         raw.homeSections   || [],
    variants:             raw.variants       || [],
    combinations:         raw.combinations   || [],
    combos:               raw.combos         || [],
    specifications:       raw.specifications || [],
    reviews:              raw.reviews        || [],
    offersWithIcon:       raw.offersWithIcon || [],
    doctorFeedbacks:      raw.doctorFeedbacks || [],
    authors,
    recommendations,
    certifications,
    images:               raw.images         || [],
    injectionTypes:       raw.injectionTypes || [],
    tabletTypes:          raw.tabletTypes    || [],
    video:                raw.video?.url ? raw.video : null,
    coupons:              filterCouponsForRole(raw.coupons || [], userRole),
    rolePrice:            getPriceForRole(raw, userRole),
  };
};

// ─── findProductByQrToken ─────────────────────────────────────────────────────

const findProductByQrToken = async (qrToken) => {
  const token = String(qrToken || "").trim();
  if (!token) return null;

  let product = await Product.findOne({ qrCodeToken: token })
    .populate("category", "title").populate("subCategory", "title");
  if (product) return product;

  const productId = parseProductIdFromQrToken(token);
  if (!productId) return null;

  product = await Product.findById(productId)
    .populate("category", "title").populate("subCategory", "title");
  if (!product) return null;

  if (!product.qrCodeToken) {
    product.qrCodeToken   = token;
    product.qrCodeUrl     = buildProductQrUrl(token);
    product.qrGeneratedAt = new Date();
    await product.save();
  }
  return product;
};

// ─── buildProductFields ───────────────────────────────────────────────────────
// Reads ALL incoming naming variants and returns a consistent object.
// Explicit rate fields WIN — pre-save hook keeps them intact.

export const buildProductFields = async (
  data,
  { existingProduct = null, requireCategory = false, productId = null } = {}
) => {
  const vendorId = await resolveVendorId(
    resolveField(data, "vendor", undefined),
    existingProduct?.vendor || null
  );

  // ── arrays ────────────────────────────────────────────────────────────────
  const tags            = hasOwn(data, "tags")            ? safeParse(data.tags, [])                   : existingProduct?.tags            || [];
  const variants        = hasOwn(data, "variants")        ? safeParse(data.variants, [])               : existingProduct?.variants        || [];
  const combinations    = hasOwn(data, "combinations")    ? await processCombinations(data.combinations) : existingProduct?.combinations  || [];
  const combos          = hasOwn(data, "combos")          ? safeParse(data.combos, [])                 : existingProduct?.combos          || [];
  const specifications  = hasOwn(data, "specifications")  ? safeParse(data.specifications, [])         : existingProduct?.specifications  || [];
  const reviews         = hasOwn(data, "reviews")         ? safeParse(data.reviews, [])                : existingProduct?.reviews         || [];
  const offersWithIcon  = hasOwn(data, "offersWithIcon")  ? safeParse(data.offersWithIcon, [])         : existingProduct?.offersWithIcon  || [];
  const doctorFeedbacks = hasOwn(data, "doctorFeedbacks") ? safeParse(data.doctorFeedbacks, [])        : existingProduct?.doctorFeedbacks || [];
  const coupons         = hasOwn(data, "coupons")         ? safeParse(data.coupons, [])                : existingProduct?.coupons         || [];
  const authors         = hasOwn(data, "authors")         ? await processAuthors(data.authors)          : existingProduct?.authors        || [];
  const injectionTypes  = hasOwn(data, "injectionTypes")  ? safeParse(data.injectionTypes, [])         : existingProduct?.injectionTypes  || [];
  const tabletTypes     = hasOwn(data, "tabletTypes")     ? safeParse(data.tabletTypes, [])             : existingProduct?.tabletTypes     || [];
  const sections        = hasOwn(data, "sections")        ? safeParse(data.sections, [])               : existingProduct?.sections        || [];
  const homeSections    = hasOwn(data, "homeSections")    ? safeParse(data.homeSections, [])           : existingProduct?.homeSections    || [];
  const recommendations = hasOwn(data, "recommendations")
    ? await processRichImageCollection(data.recommendations, "products/recommendations")
    : existingProduct?.recommendations || [];
  const certifications  = hasOwn(data, "certifications")
    ? await processRichImageCollection(data.certifications,  "products/certifications")
    : existingProduct?.certifications  || [];

  // ── category flags ────────────────────────────────────────────────────────
  let showInCategories = existingProduct?.showInCategories || deriveShowInCategories(existingProduct?.categories || {});
  let categories       = existingProduct?.categories || {};
  if (hasOwn(data, "showInCategories")) {
    showInCategories = safeParse(data.showInCategories, []);
    if (Array.isArray(showInCategories)) categories = buildCategoriesFlags(showInCategories);
  } else if (hasOwn(data, "categories")) {
    categories       = safeParse(data.categories, categories) || categories;
    showInCategories = deriveShowInCategories(categories);
  }

  // ── GST ──────────────────────────────────────────────────────────────────
  const rawGst = hasOwn(data, "gst") ? safeParse(data.gst, {}) : undefined;
  const gst = {
    igst: toNumber(resolveField(data, "gst_igst", rawGst?.igst ?? existingProduct?.gst?.igst ?? existingProduct?.gst_igst ?? 0)),
    cgst: toNumber(resolveField(data, "gst_cgst", rawGst?.cgst ?? existingProduct?.gst?.cgst ?? existingProduct?.gst_cgst ?? 0)),
    sgst: toNumber(resolveField(data, "gst_sgst", rawGst?.sgst ?? existingProduct?.gst?.sgst ?? existingProduct?.gst_sgst ?? 0)),
  };

  // ── images / video ────────────────────────────────────────────────────────
  const images = hasOwn(data, "images")
    ? await processImageList(data.images, "products/images")
    : existingProduct?.images || [];
  let video = existingProduct?.video || null;
  if (hasOwn(data, "video")) video = await uploadAssetIfNeeded(data.video, "products/videos", "video");

  // ── category / subCategory / zone ─────────────────────────────────────────
  let category    = existingProduct?.category    || null;
  let subCategory = existingProduct?.subCategory ?? null;
  let franchiseZoneId = existingProduct?.franchiseZoneId ?? null;
  if (hasOwn(data, "category"))      category        = await ensureCategoryId(data.category, "category");
  else if (requireCategory)          category        = await ensureCategoryId(category, "category");
  if (hasOwn(data, "subCategory"))   subCategory     = await ensureSubCategoryId(data.subCategory);
  if (hasOwn(data, "franchiseZoneId")) franchiseZoneId = await ensureZoneId(data.franchiseZoneId);

  // ── scalar fields ─────────────────────────────────────────────────────────
  const genericCompositions = resolveField(data, ["genericCompositions","genericName"],    existingProduct?.genericCompositions || existingProduct?.genericName    || "");
  const genericName         = resolveField(data, ["genericName","genericCompositions"],    existingProduct?.genericName         || existingProduct?.genericCompositions || "");
  const packageType         = resolveField(data, ["packageType","packagingType"],          existingProduct?.packageType         || existingProduct?.packagingType  || "");
  const batchDateEffect     = resolveField(data, ["batchDateEffect","dateOfEffect"],       existingProduct?.batchDateEffect     || existingProduct?.dateOfEffect   || "");

  const mrp = toNumber(resolveField(data, "mrp", existingProduct?.mrp ?? 0));
  const amp = toNumber(resolveField(data, "amp", existingProduct?.amp ?? 0));

  // ── DISCOUNTS — read both naming conventions ───────────────────────────────
  const discountB2C          = toNumber(resolveField(data, ["discountB2C",         "b2cDiscount"],          existingProduct?.discountB2C         ?? existingProduct?.b2cDiscount         ?? 0));
  const discountB2B          = toNumber(resolveField(data, ["discountB2B",         "b2bDiscount"],          existingProduct?.discountB2B         ?? existingProduct?.b2bDiscount         ?? 0));
  const discountHospital     = toNumber(resolveField(data, ["discountHospital",    "hospitalDiscount",     "hospitalPharmacyDiscount"], existingProduct?.discountHospital  ?? existingProduct?.hospitalPharmacyDiscount ?? 0));
  const discountPharmacy     = toNumber(resolveField(data, ["discountPharmacy",    "pharmacyDiscount"],     existingProduct?.discountPharmacy     ?? 0));
  const discountWholesale    = toNumber(resolveField(data, ["discountWholesale",   "wholesaleDiscount"],    existingProduct?.discountWholesale    ?? 0));
  const discountVendor       = toNumber(resolveField(data, ["discountVendor",      "vendorDiscount"],       existingProduct?.discountVendor       ?? 0));
  const discountFranchise    = toNumber(resolveField(data, ["discountFranchise",   "franchiseDiscount"],    existingProduct?.discountFranchise    ?? 0));
  const discountManufacturer = toNumber(resolveField(data, ["discountManufacturer","manufacturerDiscount"], existingProduct?.discountManufacturer ?? 0));

  // ── EXPLICIT RATES — prefer incoming, fall back to existing ───────────────
  // We set ALL alias fields here so the pre-save hook sees the correct values.
  const saleRatePTR       = toNumber(resolveField(data, ["saleRatePTR","ptr","rateB2C"],                                          existingProduct?.saleRatePTR     ?? existingProduct?.ptr            ?? existingProduct?.rateB2C      ?? 0));
  const wholesaleSaleRate = toNumber(resolveField(data, ["wholesaleSaleRate","wsr","rateWholesale"],                               existingProduct?.wholesaleSaleRate ?? existingProduct?.wsr           ?? existingProduct?.rateWholesale ?? 0));
  const hospitalSaleRate  = toNumber(resolveField(data, ["hospitalSaleRate","saleRateHPSR","hpsr","hospitalRate","rateHospital"], existingProduct?.hospitalSaleRate ?? existingProduct?.saleRateHPSR   ?? existingProduct?.hpsr         ?? existingProduct?.rateHospital ?? 0));
  const pharmacySaleRate  = toNumber(resolveField(data, ["pharmacySaleRate","pharmacyRate","ratePharmacy"],                       existingProduct?.pharmacySaleRate ?? existingProduct?.ratePharmacy   ?? 0));
  const vendorRate        = toNumber(resolveField(data, ["vendorRate","rateVendor"],                                              existingProduct?.vendorRate       ?? existingProduct?.rateVendor     ?? 0));
  const franchiseRate     = toNumber(resolveField(data, ["franchiseRate","rateFranchise"],                                        existingProduct?.franchiseRate    ?? existingProduct?.rateFranchise  ?? 0));
  const manufacturerRate  = toNumber(resolveField(data, ["manufacturerRate","rateManufacturer"],                                  existingProduct?.manufacturerRate ?? existingProduct?.rateManufacturer ?? 0));
  const rateB2B           = toNumber(resolveField(data, ["rateB2B","b2bRate"],                                                    existingProduct?.rateB2B          ?? 0));

  // ── QR ────────────────────────────────────────────────────────────────────
  const qrProductId   = productId || existingProduct?._id || new mongoose.Types.ObjectId();
  const qrCodeToken   = existingProduct?.qrCodeToken || buildProductQrToken(qrProductId);
  const qrCodeUrl     = existingProduct?.qrCodeUrl   || buildProductQrUrl(qrCodeToken);
  const qrGeneratedAt = existingProduct?.qrGeneratedAt || new Date();

  return {
    vendor: vendorId,
    manufacturer:       resolveField(data, "manufacturer",  existingProduct?.manufacturer  || ""),
    brandName:          resolveField(data, "brandName",     existingProduct?.brandName     || ""),
    genericName,
    genericCompositions,
    hsn:          resolveField(data, "hsn",         existingProduct?.hsn         || ""),
    batchNumber:  resolveField(data, "batchNumber", existingProduct?.batchNumber || ""),
    totalStocks:  toNumber(resolveField(data, "totalStocks",  existingProduct?.totalStocks  ?? 0)),
    stocks:       toNumber(resolveField(data, ["stocks","totalStocks"], existingProduct?.stocks ?? existingProduct?.totalStocks ?? 0)),
    productWeight: toNumber(resolveField(data, "productWeight", existingProduct?.productWeight ?? 0)),
    packagingType: packageType,
    packageType,
    caseBoxPackage: resolveField(data, "caseBoxPackage", existingProduct?.caseBoxPackage || ""),
    casePackPrice:  toNumber(resolveField(data, "casePackPrice", existingProduct?.casePackPrice ?? 0)),
    injectionTypes,
    tabletTypes,
    dateOfEffect:  batchDateEffect,
    batchDateEffect,
    expiryDate:    resolveField(data, "expiryDate",  existingProduct?.expiryDate  || ""),
    minRateFixed:  toNumber(resolveField(data, "minRateFixed", existingProduct?.minRateFixed ?? 0)),
    mrp,
    amp,

    // All rate aliases — ensures pre-save hook snapshot is complete
    saleRatePTR,      ptr: saleRatePTR,           rateB2C: saleRatePTR,
    wholesaleSaleRate, wsr: wholesaleSaleRate,     rateWholesale: wholesaleSaleRate,
    hospitalSaleRate,  saleRateHPSR: hospitalSaleRate, hpsr: hospitalSaleRate, rateHospital: hospitalSaleRate,
    pharmacySaleRate,  ratePharmacy: pharmacySaleRate,
    vendorRate,        rateVendor: vendorRate,
    franchiseRate,     rateFranchise: franchiseRate,
    manufacturerRate,  rateManufacturer: manufacturerRate,
    rateB2B,

    // All discount aliases
    discountB2C,       b2cDiscount: discountB2C,
    discountB2B,       b2bDiscount: discountB2B,
    discountHospital,  hospitalPharmacyDiscount: discountHospital,
    discountPharmacy,
    discountWholesale,
    discountVendor,
    discountFranchise,
    discountManufacturer,

    totalCostOfStores:      toNumber(resolveField(data, "totalCostOfStores",      existingProduct?.totalCostOfStores      ?? 0)),
    totalActualValue:       toNumber(resolveField(data, "totalActualValue",       existingProduct?.totalActualValue       ?? 0)),
    totalSaleValue:         toNumber(resolveField(data, "totalSaleValue",         existingProduct?.totalSaleValue         ?? 0)),
    totalBusinessSaleValue: toNumber(resolveField(data, "totalBusinessSaleValue", existingProduct?.totalBusinessSaleValue ?? 0)),
    totalWholesaleValue:    toNumber(resolveField(data, "totalWholesaleValue",    existingProduct?.totalWholesaleValue    ?? 0)),

    gst,
    gst_igst: gst.igst,
    gst_cgst: gst.cgst,
    gst_sgst: gst.sgst,
    gstDateEffect: resolveField(data, "gstDateEffect", existingProduct?.gstDateEffect || ""),

    offersWithIcon,
    additionalOffers: resolveField(data, "additionalOffers", existingProduct?.additionalOffers || ""),
    scheme1:  resolveField(data, "scheme1",  existingProduct?.scheme1  || ""),
    scheme2:  resolveField(data, "scheme2",  existingProduct?.scheme2  || ""),
    coupons,
    tags,
    showInCategories,
    categories,
    sections,
    homeSections,

    description:      resolveField(data, ["description",     "fullDescription"],  existingProduct?.description     || existingProduct?.fullDescription    || ""),
    moreInformation:  resolveField(data, ["moreInformation", "shortDescription"], existingProduct?.moreInformation || existingProduct?.shortDescription   || ""),
    shortDescription: resolveField(data, ["shortDescription","moreInformation"],  existingProduct?.shortDescription|| existingProduct?.moreInformation    || ""),
    fullDescription:  resolveField(data, ["fullDescription", "description"],      existingProduct?.fullDescription || existingProduct?.description        || ""),
    disclaimer:       resolveField(data, "disclaimer",        existingProduct?.disclaimer || ""),

    currentStatus1: resolveField(data, ["currentStatus1","statusActive"],  existingProduct?.currentStatus1 || existingProduct?.statusActive  || "active"),
    currentStatus2: resolveField(data, ["currentStatus2","statusAppear"],  existingProduct?.currentStatus2 || existingProduct?.statusAppear  || "appear"),
    statusActive:   resolveField(data, ["statusActive",  "currentStatus1"],existingProduct?.statusActive   || existingProduct?.currentStatus1 || "active"),
    statusAppear:   resolveField(data, ["statusAppear",  "currentStatus2"],existingProduct?.statusAppear   || existingProduct?.currentStatus2 || "appear"),
    isOTC: toBoolean(resolveField(data, "isOTC", existingProduct?.isOTC ?? true), existingProduct?.isOTC ?? true),

    productRating: toNumber(resolveField(data, ["productRating","rating"],  existingProduct?.productRating ?? existingProduct?.rating        ?? 0)),
    rating:        toNumber(resolveField(data, ["rating","productRating"],  existingProduct?.rating        ?? existingProduct?.productRating  ?? 0)),
    thumbsUp:      toNumber(resolveField(data, "thumbsUp",  existingProduct?.thumbsUp  ?? 0)),
    thumbsDown:    toNumber(resolveField(data, "thumbsDown", existingProduct?.thumbsDown ?? 0)),
    voters:        hasOwn(data, "voters") ? safeParse(data.voters, []) : existingProduct?.voters || [],
    topReviewFromIndia: resolveField(data, "topReviewFromIndia", existingProduct?.topReviewFromIndia || ""),
    doctorFeedbacks,
    reviews,
    authors,

    marketerName:    resolveField(data, "marketerName",    existingProduct?.marketerName    || ""),
    marketerAddress: resolveField(data, "marketerAddress", existingProduct?.marketerAddress || ""),
    countryOfOrigin: resolveField(data, "countryOfOrigin", existingProduct?.countryOfOrigin || ""),
    lastUpdated:     resolveField(data, "lastUpdated",     existingProduct?.lastUpdated     || ""),

    variants,
    combinations,
    combos,
    specifications,
    recommendations,
    certifications,
    images,
    video,
    qrCodeToken,
    qrCodeUrl,
    qrGeneratedAt,
    category,
    subCategory,
    franchiseZoneId,
    autoDateTime: resolveField(data, "autoDateTime", existingProduct?.autoDateTime || ""),
  };
};

// ─── Combo sync ────────────────────────────────────────────────────────────────

const syncCombosAcrossProducts = async (sourceProductId, combos = []) => {
  for (const combo of combos || []) {
    for (const cp of combo?.products || []) {
      const otherId = String(cp?._id || cp || "");
      if (!mongoose.Types.ObjectId.isValid(otherId) || String(sourceProductId) === otherId) continue;
      try {
        const other = await Product.findById(otherId);
        if (!other) continue;
        const idx = (other.combos || []).findIndex((c) => c.id === combo.id);
        if (idx >= 0) other.combos[idx] = combo;
        else other.combos = [...(other.combos || []), combo];
        other.markModified("combos");
        await other.save();
      } catch (err) { console.warn(`Combo sync failed for ${otherId}: ${err.message}`); }
    }
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export const createProduct = async (req, res) => {
  try {
    const productId = new mongoose.Types.ObjectId();
    const fields    = await buildProductFields(req.body || {}, { requireCategory: true, productId });
    const product   = await Product.create({ _id: productId, ...fields });
    if (product.combos?.length) await syncCombosAcrossProducts(product._id, product.combos);
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: normalizeProductForResponse(product, getRequestRole(req)),
    });
  } catch (error) {
    const ce = readCloudinaryError(error);
    return res.status(error.statusCode || ce.httpCode || 500).json({ success: false, message: error.message || ce.message });
  }
};

export const uploadProductVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const uploadedVideo = await uploadAssetIfNeeded(req.body?.video, "products/videos", "video");
    if (!uploadedVideo) return res.status(400).json({ success: false, message: "No video provided" });
    await destroyVideo(product.video);
    product.video = uploadedVideo;
    await product.save();
    return res.json({ success: true, video: product.video });
  } catch (error) {
    const ce = readCloudinaryError(error);
    return res.status(error.statusCode || ce.httpCode || 500).json({ success: false, message: error.message || ce.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const userRole = getRequestRole(req);
    const products = await Product.find()
      .populate("category",    "title")
      .populate("subCategory", "title")
      .populate("vendor",      "fullName businessName email phone")
      .sort({ createdAt: -1 })
      .lean();
    const normalized = products.map((p) => normalizeProductForResponse(p, userRole));
    return res.json({ success: true, products: normalized, data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne(findProductQuery(req.params.id))
      .populate("category", "title").populate("subCategory", "title").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, product: normalizeProductForResponse(product, getRequestRole(req)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProductByTitle = async (req, res) => {
  try {
    const product = await Product.findOne(findProductQuery(decodeURIComponent(req.params.title || "")))
      .populate("category", "title").populate("subCategory", "title").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, product: normalizeProductForResponse(product, getRequestRole(req)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProductByQrToken = async (req, res) => {
  try {
    const qrToken = decodeURIComponent(req.params.token || "").trim();
    if (!qrToken) return res.status(400).json({ success: false, message: "QR token is required" });
    const product = await findProductByQrToken(qrToken);
    if (!product) return res.status(404).json({ success: false, message: "Product not found for this QR code" });
    const n = normalizeProductForResponse(product, getRequestRole(req));
    return res.json({
      success: true,
      product: {
        id: n._id, qrCodeToken: n.qrCodeToken, qrCodeUrl: n.qrCodeUrl,
        manufacturer: n.manufacturer, brandName: n.brandName, genericCompositions: n.genericCompositions,
        hsn: n.hsn, batchNumber: n.batchNumber, expiryDate: n.expiryDate,
        productWeight: n.productWeight, totalStocks: n.totalStocks, mrp: n.mrp,
        category: product.category?.title || "", subCategory: product.subCategory?.title || "",
        productRating: n.productRating, currentStatus1: n.currentStatus1,
        currentStatus2: n.currentStatus2, isOTC: n.isOTC,
        createdAt: n.createdAt, updatedAt: n.updatedAt, images: n.images,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProductQrCodeImage = async (req, res) => {
  try {
    const qrToken = decodeURIComponent(req.params.token || "").trim();
    if (!qrToken) return res.status(400).json({ success: false, message: "QR token is required" });
    const product = await findProductByQrToken(qrToken);
    if (!product) return res.status(404).json({ success: false, message: "Product not found for this QR code" });
    const pngBuffer = await QRCode.toBuffer(product.qrCodeUrl || buildProductQrUrl(product.qrCodeToken), {
      type: "png", width: 360, margin: 1, errorCorrectionLevel: "H",
    });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(pngBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate QR image" });
  }
};

export const filterProducts = async (req, res) => {
  try {
    const { categoryName, brandName, section, homeSection, category, brand, main } = req.query;
    const filter = {};

    if (main) {
      const mainCat = await findCategoryByIdentifier(main);
      if (!mainCat) return res.json({ success: true, count: 0, products: [] });
      const subs = await Category.find({ parentCategory: mainCat._id }).select("_id").lean();
      filter.$or = [{ category: mainCat._id }, { subCategory: { $in: subs.map((s) => s._id) } }];
    }

    const catValue = categoryName || category;
    if (catValue) {
      const catDoc = await findCategoryByIdentifier(catValue);
      if (!catDoc) return res.json({ success: true, count: 0, products: [] });
      if (catDoc.parentCategory) filter.subCategory = catDoc._id;
      else                        filter.category    = catDoc._id;
    }

    const brandValue = brandName || brand;
    if (brandValue) filter.brandName = { $regex: new RegExp(`^${escapeRegex(brandValue)}$`, "i") };

    if (section) {
      const term  = section.trim();
      const regex = new RegExp(term.replace(/[-\s]+/g, "[\\s\\-]+"), "i");
      const secCondition = {
        $or: [
          { sections:     { $elemMatch: { $regex: regex } } },
          { homeSections: { $elemMatch: { $regex: regex } } }, 
        ],
      };
      if (filter.$or) filter.$and = [{ $or: filter.$or }, secCondition];
      else Object.assign(filter, secCondition);
    }

    if (homeSection) {
      const trimmed    = homeSection.trim();
      const withSpaces = trimmed.replace(/-/g, " ").toLowerCase();
      const withDashes = trimmed.replace(/\s+/g, "-").toLowerCase();
      const hsCondition = { homeSections: { $elemMatch: { $regex: new RegExp(`^(${withSpaces}|${withDashes}|${trimmed})$`, "i") } } };
      if (filter.$or) filter.$or.push(hsCondition);
      else filter.$or = [hsCondition];
    }

    const products   = await Product.find(filter).populate("category","title").populate("subCategory","title").lean();
    const normalized = products.map((p) => normalizeProductForResponse(p, getRequestRole(req)));
    return res.json({ success: true, count: normalized.length, products: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProductById = async (req, res) => {
  try {
    const product = await Product.findOne(findProductQuery(req.params.id));
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const nextFields = await buildProductFields(req.body || {}, { existingProduct: product });
    await cleanupChangedProductAssets(product, nextFields, req.body || {});

    Object.assign(product, nextFields);
    product.markModified("gst");
    product.markModified("categories");
    await product.save();

    if (hasOwn(req.body, "combos")) await syncCombosAcrossProducts(product._id, product.combos || []);

    const populated = await Product.findById(product._id)
      .populate("category","title").populate("subCategory","title");
    return res.json({ success: true, product: normalizeProductForResponse(populated, getRequestRole(req)) });
  } catch (error) {
    const ce = readCloudinaryError(error);
    return res.status(error.statusCode || ce.httpCode || 500).json({ success: false, message: error.message || ce.message });
  }
};

export const updateProductByTitle = async (req, res) => {
  req.params.id = req.params.title;
  return updateProductById(req, res);
};

export const deleteProductById = async (req, res) => {
  try {
    const product = await Product.findOne(findProductQuery(req.params.id));
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    await destroyProductAssets(product);
    await product.deleteOne();
    return res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete product", error: error.message });
  }
};

export const deleteProductByTitle = async (req, res) => {
  req.params.id = req.params.title;
  return deleteProductById(req, res);
};

export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, user, orderId, media } = req.body || {};

    if (!rating || Number(rating) < 1 || Number(rating) > 5)
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    if (!comment?.trim())
      return res.status(400).json({ success: false, message: "Review comment is required" });

    const product     = await Product.findById(id);
    if (!product)     return res.status(404).json({ success: false, message: "Product not found" });

    const currentUser = getRequestUser(req);
    const userId      = currentUser?._id || currentUser?.id || null;
    let reviewUser    = user?.trim() || "Guest";
    let isVerified    = false;

    if (currentUser) reviewUser = currentUser.name || currentUser.email || reviewUser;

    if (userId) {
      const exists = (product.reviews || []).find((r) => String(r.userId || "") === String(userId));
      if (exists) return res.status(409).json({ success: false, message: "You have already reviewed this product" });
    }

    if (orderId) {
      const cleanId = String(orderId).replace(/^#/, "").trim();
      const order   = await Order.findOne({
        $or: [mongoose.Types.ObjectId.isValid(cleanId) ? { _id: cleanId } : null, { orderId: cleanId }].filter(Boolean),
      }).lean();
      if (!order) return res.status(400).json({ success: false, message: "Order not found" });
      if (userId) {
        const ouid = String(order.userId || order.user || order.customer?._id || "");
        if (ouid && ouid !== String(userId))
          return res.status(403).json({ success: false, message: "This order does not belong to your account" });
      }
      const items = order.items || order.products || order.orderItems || [];
      const has   = items.some((i) => String(i.productId?._id || i.productId || i.product?._id || i.product || "") === String(product._id));
      if (!has) return res.status(400).json({ success: false, message: "This product was not found in that order" });
      isVerified = true;
    }

    const sanitizedMedia = (Array.isArray(media) ? media.slice(0, 4) : [])
      .filter((m) => m?.url && typeof m.url === "string" && m.url.startsWith("https://res.cloudinary.com"))
      .map((m) => ({ url: m.url, publicId: m.publicId || m.public_id || "", resourceType: m.resourceType === "video" ? "video" : "image" }));

    product.reviews.push({ user: reviewUser, userId, rating: Number(rating), comment: comment.trim(), verified: isVerified, media: sanitizedMedia, date: new Date().toISOString().split("T")[0] });
    const total = product.reviews.reduce((s, r) => s + (r.rating || 0), 0);
    product.rating        = Number((total / product.reviews.length).toFixed(1));
    product.productRating = product.rating;
    await product.save();

    return res.json({ success: true, message: "Review submitted successfully", rating: product.rating, reviewCount: product.reviews.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const voteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, orderId } = req.body || {};
    const currentUser = req.user;
    if (!currentUser) return res.status(401).json({ success: false, message: "Please login to vote" });
    const userId = currentUser._id || currentUser.id;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const alreadyVoted = (product.voters || []).some((v) => String(v.userId) === String(userId));
    if (alreadyVoted) return res.status(409).json({ success: false, message: "You have already voted on this product" });

    if (orderId) {
      const cleanId = String(orderId).replace(/^#/, "").trim();
      const order   = await Order.findOne({
        $or: [mongoose.Types.ObjectId.isValid(cleanId) ? { _id: cleanId } : null, { orderId: cleanId }].filter(Boolean),
      }).lean();
      if (!order) return res.status(400).json({ success: false, message: "Order not found" });
      const ouid = String(order.userId || order.user || order.customer?._id || "");
      if (ouid && ouid !== String(userId))
        return res.status(403).json({ success: false, message: "This order does not belong to your account" });
      const items = order.items || order.products || order.orderItems || [];
      const has   = items.some((i) => String(i.productId?._id || i.productId || i.product?._id || i.product || "") === String(product._id));
      if (!has) return res.status(400).json({ success: false, message: "This product was not found in that order" });
    }

    if      (type === "up")   product.thumbsUp   = (product.thumbsUp   || 0) + 1;
    else if (type === "down") product.thumbsDown  = (product.thumbsDown || 0) + 1;
    else return res.status(400).json({ success: false, message: "Invalid vote type" });

    product.voters = product.voters || [];
    product.voters.push({ userId, type, orderId: orderId || null });
    await product.save();
    return res.json({ success: true, thumbsUp: product.thumbsUp, thumbsDown: product.thumbsDown });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};