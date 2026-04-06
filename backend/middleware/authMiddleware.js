import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Manufacturer from "../models/Manufacturer.js";
import Franchise from "../models/Franchise.js";

let Vendor, Doctor, Pharmacy;
try { ({ default: Vendor }  = await import("../models/Vendor.js"));   } catch (_) {}
try { ({ default: Doctor }  = await import("../models/Doctor.js"));   } catch (_) {}
try { ({ default: Pharmacy } = await import("../models/Pharmacy.js")); } catch (_) {}

const MODEL_ROLE_MAP = {
  admin:        "admin",
  user:         "customer",
  hospital:     "hospital",
  manufacturer: "manufacturer",
  franchise:    "franchise",
  vendor:       "vendor",
  doctor:       "b2b",
  pharmacy:     "pharmacy",
};

const findUserAcrossModels = async (id) => {
  const admin = await Admin.findById(id).select("-password");
  if (admin) return { userDoc: admin, userType: "admin" };

  const user = await User.findById(id).select("-password");
  if (user) return { userDoc: user, userType: "user" };

  const hospital = await Hospital.findById(id).select("-password");
  if (hospital) return { userDoc: hospital, userType: "hospital" };

  const manufacturer = await Manufacturer.findById(id).select("-password");
  if (manufacturer) return { userDoc: manufacturer, userType: "manufacturer" };

  const franchise = await Franchise.findById(id).select("-password");
  if (franchise) return { userDoc: franchise, userType: "franchise" };

  if (Vendor) {
    const vendor = await Vendor.findById(id).select("-password");
    if (vendor) return { userDoc: vendor, userType: "vendor" };
  }
  if (Doctor) {
    const doctor = await Doctor.findById(id).select("-password");
    if (doctor) return { userDoc: doctor, userType: "doctor" };
  }
  if (Pharmacy) {
    const pharmacy = await Pharmacy.findById(id).select("-password");
    if (pharmacy) return { userDoc: pharmacy, userType: "pharmacy" };
  }

  return null;
};

export const protect = async (req, res, next) => {
  let token;

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    console.log("JWT_SECRET used for verify:", JSON.stringify(process.env.JWT_SECRET));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId  = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const result = await findUserAcrossModels(userId);

    if (!result) {
      return res.status(401).json({ message: "User does not exist or has been deleted" });
    }

    const docRole    = result.userDoc.role;
    const mappedRole = MODEL_ROLE_MAP[result.userType] || "customer";

    req.user          = result.userDoc;
    req.user.role     = docRole || mappedRole;
    req.userType      = result.userType;

    next();
  } catch (err) {
    console.error("Auth error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalid" });
    }
    return res.status(401).json({ message: "Authorization failed" });
  }
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token   = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId  = payload.id || payload._id;

    const result = await findUserAcrossModels(userId);
    if (!result) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const docRole    = result.userDoc.role;
    const mappedRole = MODEL_ROLE_MAP[result.userType] || "customer";

    req.user      = result.userDoc;
    req.user.role = docRole || mappedRole;
    req.userType  = result.userType;

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

// ── FIXED: req.user = null for guests (was { role: "customer" } which is
//    truthy and caused placeOrder to take the logged-in path, find no cart,
//    and return 400 "Cart is empty") ──
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null; // guest — no token at all
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId  = decoded.id || decoded._id;

    if (!userId) {
      req.user = null; // malformed token payload
      return next();
    }

    const result = await findUserAcrossModels(userId);

    if (!result) {
      req.user = null; // token valid but user deleted
      return next();
    }

    const docRole    = result.userDoc.role;
    const mappedRole = MODEL_ROLE_MAP[result.userType] || "customer";

    req.user      = result.userDoc;
    req.user.role = docRole || mappedRole;
    req.userType  = result.userType;

    next();
  } catch (err) {
    // expired / invalid token → treat as guest, never send 401
    req.user = null;
    next();
  }
};

export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (req.userType !== "admin" && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};