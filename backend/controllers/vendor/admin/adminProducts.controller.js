import Product from "../../../models/Product.js";
import { v2 as cloudinary } from "cloudinary";
import { deleteFromCloudinary } from "../../../utils/cloudinaryDelete.js";
const safeParse = (v, fb) => {
  try { return typeof v === "string" ? JSON.parse(v) : (v ?? fb); }
  catch { return fb; }
};

const uploadIfBase64 = async (data, folder, resourceType = "image") => {
  if (typeof data === "string" && data.startsWith("data:")) {
    const result = await cloudinary.uploader.upload(data, { folder, resource_type: resourceType });
    return { url: result.secure_url, public_id: result.public_id };
  }
  return data;
};

const FIELD_MAP = {
  manufacturer:             "manufacturer",
  brandName:                "brandName",
  genericCompositions:      "genericCompositions",
  hsn:                      "hsn",
  batchNumber:              "batchNumber",
  totalStocks:              "totalStocks",
  productWeight:            "productWeight",
  packageType:              "packageType",
  caseBoxPackage:           "caseBoxPackage",
  casePackPrice:            "casePackPrice",
  batchDateEffect:          "dateOfEffect",
  expiryDate:               "expiryDate",
  gstDateEffect:            "gstDateEffect",
  minRateFixed:             "minRateFixed",
  mrp:                      "mrp",
  amp:                      "amp",
  saleRatePTR:              "saleRatePTR",
  wholesaleSaleRate:        "wholesaleSaleRate",
  hospitalSaleRate:         "hospitalSaleRate",
  pharmacySaleRate:         "pharmacySaleRate",
  vendorRate:               "vendorRate",
  franchiseRate:            "franchiseRate",
  manufacturerRate:         "manufacturerRate",
  totalCostOfStores:        "totalCostOfStores",
  totalActualValue:         "totalActualValue",
  totalSaleValue:           "totalSaleValue",
  totalBusinessSaleValue:   "totalBusinessSaleValue",
  totalWholesaleValue:      "totalWholesaleValue",
  b2cDiscount:              "discountB2C",
  b2bDiscount:              "discountB2B",
  hospitalDiscount:         "discountHospital",
  pharmacyDiscount:         "discountPharmacy",
  wholesaleDiscount:        "discountWholesale",
  vendorDiscount:           "discountVendor",
  franchiseDiscount:        "discountFranchise",
  manufacturerDiscount:     "discountManufacturer",
  b2bRate:                  "rateB2B",
  hospitalRate:             "rateHospital",
  pharmacyRate:             "ratePharmacy",
  description:              "fullDescription",
  moreInformation:          "shortDescription",
  disclaimer:               "disclaimer",
  offersWithIcon:           "offersWithIcon",
  additionalOffers:         "additionalOffers",
  scheme1:                  "scheme1",
  scheme2:                  "scheme2",
  tags:                     "tags",
  category:                 "category",
  subCategory:              "subCategory",
  sections:                 "sections",
  currentStatus1:           "statusActive",
  currentStatus2:           "statusAppear",
  isOTC:                    "isOTC",
  productRating:            "rating",
  topReviewFromIndia:       "topReviewFromIndia",
  doctorFeedbacks:          "doctorFeedbacks",
  coupons:                  "coupons",
  authors:                  "authors",
  combinations:             "combinations",
  combos:                   "combos",
  injectionTypes:           "injectionTypes",
  tabletTypes:              "tabletTypes",
  recommendations:          "recommendations",
  certifications:           "certifications",
  marketerName:             "marketerName",
  marketerAddress:          "marketerAddress",
  countryOfOrigin:          "countryOfOrigin",
  lastUpdated:              "lastUpdated",
  variants:                 "variants",
  specifications:           "specifications",
  reviews:                  "reviews",
  images:                   "images",
  video:                    "video",
};

const NUMERIC_SCHEMA_FIELDS = new Set([
  "totalStocks","productWeight","casePackPrice","minRateFixed","mrp","amp",
  "saleRatePTR","wholesaleSaleRate","hospitalSaleRate","pharmacySaleRate",
  "vendorRate","franchiseRate","manufacturerRate",
  "totalCostOfStores","totalActualValue","totalSaleValue",
  "totalBusinessSaleValue","totalWholesaleValue",
  "discountB2C","discountB2B","discountHospital","discountPharmacy",
  "discountWholesale","discountVendor","discountFranchise","discountManufacturer",
  "rateB2C","rateB2B","rateHospital","ratePharmacy",
  "rateWholesale","rateVendor","rateFranchise","rateManufacturer",
  "rating","gst_igst","gst_cgst","gst_sgst",
]);

const buildAdminFields = async (body) => {
  const fields = {};

  for (const [fk, value] of Object.entries(body)) {
    if (value === "" || value === undefined || value === null) continue;

    if (fk === "gst" && typeof value === "object" && !Array.isArray(value)) {
      if (value.igst != null) fields.gst_igst = Number(value.igst) || 0;
      if (value.cgst != null) fields.gst_cgst = Number(value.cgst) || 0;
      if (value.sgst != null) fields.gst_sgst = Number(value.sgst) || 0;
      continue;
    }

    if (fk === "showInCategories") {
      const arr = safeParse(value, []);
      if (Array.isArray(arr)) {
        fields.categories = {
          cat1: !!arr[0], cat2: !!arr[1], cat3: !!arr[2],
          cat4: !!arr[3], cat5: !!arr[4], cat6: !!arr[5],
          cat7: !!arr[6], cat8: !!arr[7], cat9: !!arr[8],
        };
      }
      continue;
    }

    if (fk === "images" || fk === "video") continue;

    const schemaField = FIELD_MAP[fk];
    if (!schemaField) {
      fields[fk] = value;
      continue;
    }

    if (NUMERIC_SCHEMA_FIELDS.has(schemaField)) {
      fields[schemaField] = Number(value) || 0;
    } else {
      fields[schemaField] = safeParse(value, value);
    }
  }

  //  Images (Cloudinary upload) 
  if (Array.isArray(body.images) && body.images.length > 0) {
    const uploaded = [];
    for (const img of body.images) {
      const result = await uploadIfBase64(img, "products/images", "image");
      if (result) uploaded.push(result);
    }
    fields.images = uploaded;
  }

  //  Video (Cloudinary upload) 
  if (body.video) {
    const arr = Array.isArray(body.video) ? body.video : [body.video];
    if (arr[0]) fields.video = await uploadIfBase64(arr[0], "products/videos", "video");
  }

  //  Combination images (Cloudinary upload) 
  if (Array.isArray(fields.combinations) && fields.combinations.length > 0) {
    const processed = [];
    for (const combo of fields.combinations) {
      const c = { ...combo };
      if (c.image && typeof c.image === "string" && c.image.startsWith("data:")) {
        c.image = await uploadIfBase64(c.image, "products/combo-images", "image");
      }
      processed.push(c);
    }
    fields.combinations = processed;
  }

  //  Recommendation images (Cloudinary upload) 
  if (Array.isArray(fields.recommendations) && fields.recommendations.length > 0) {
    const processed = [];
    for (const rec of fields.recommendations) {
      const r = { ...rec };
      if (r.image && typeof r.image === "string" && r.image.startsWith("data:")) {
        r.image = await uploadIfBase64(r.image, "products/recommendations", "image");
      }
      processed.push(r);
    }
    fields.recommendations = processed;
  }

  //  Certification images (Cloudinary upload) 
  if (Array.isArray(fields.certifications) && fields.certifications.length > 0) {
    const processed = [];
    for (const cert of fields.certifications) {
      const c = { ...cert };
      if (c.image && typeof c.image === "string" && c.image.startsWith("data:")) {
        c.image = await uploadIfBase64(c.image, "products/certifications", "image");
      }
      processed.push(c);
    }
    fields.certifications = processed;
  }

  return fields;
}; // ← END buildAdminFields


export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("vendor", "businessName email")
      .populate("category", "title")
      .populate("subCategory", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    console.error("Admin Products Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const q     = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);

    if (!q) return res.json({ success: true, products: [] });

    const regex = new RegExp(q, "i");

    const products = await Product.find({
      $or: [
        { brandName:           regex },
        { genericCompositions: regex },
        { manufacturer:        regex },
        { hsn:                 regex },
      ],
      statusActive: "active",
    })
      .select("_id brandName mrp images genericCompositions manufacturer")
      .limit(limit)
      .lean();

    res.json({ success: true, products });
  } catch (err) {
    console.error("Search Products Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getVendorProducts = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const products = await Product.find({ vendor: vendorId })
      .populate("vendor", "businessName email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch vendor products" });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });
    const products = await Product.find({ vendor: userId })
      .populate("category", "title")
      .populate("subCategory", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch your products" });
  }
};

/*TOGGLE PRODUCT STATUS*/
export const toggleProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status }    = req.body;
    const product = await Product.findByIdAndUpdate(
      productId, { statusActive: status }, { new: true }
    );
    res.json({ success: true, message: "Product status updated", data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update product status" });
  }
};

/* GET SINGLE PRODUCT */
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId)
      .populate("vendor", "businessName email")
      .populate("category", "title _id")
      .populate("subCategory", "title _id");

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Get Product Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

/*ADD PRODUCT*/
export const addProduct = async (req, res) => {
  try {
    console.log("ADMIN ADD PRODUCT HIT");

    const fields = await buildAdminFields(req.body);

    

if (req.user?.role === "vendor") {
  fields.vendor = req.user.id || req.user._id;
} else {
  fields.vendor = null; 
}

    if (!fields.category) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    const product = await Product.create(fields);
    res.status(201).json({ success: true, message: "Product added successfully", data: product });
  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to add product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found" });

    const fields = await buildAdminFields(req.body);

    if (!fields.images?.length) delete fields.images;
    if (!fields.video)          delete fields.video;

    if (req.body.images?.length) {
      for (const old of existingProduct.images || []) {
        if (old.public_id) await deleteFromCloudinary(old.public_id, "image");
      }
    }
    if (req.body.video && existingProduct.video?.public_id) {
      await deleteFromCloudinary(existingProduct.video.public_id, "video");
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    console.log(`Admin updating product ${productId}:`, Object.keys(fields));

    const product = await Product.findByIdAndUpdate(
      productId, { $set: fields }, { new: true, runValidators: false }
    );

    res.json({ success: true, message: "Product updated successfully", data: product });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    for (const img of product.images || []) {
      if (img.public_id) await deleteFromCloudinary(img.public_id, "image");
    }
    if (product.video?.public_id) {
      await deleteFromCloudinary(product.video.public_id, "video");
    }

    await product.deleteOne();
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};