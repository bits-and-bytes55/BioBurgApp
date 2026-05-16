import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Manufacturer from "../models/Manufacturer.js";
import Franchise from "../models/Franchise.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

let Vendor, Doctor, Pharmacy;

try {
  ({ default: Vendor } = await import("../models/Vendor.js"));
} catch (_) {}

try {
  ({ default: Doctor } = await import("../models/Doctor.js"));
} catch (_) {}

try {
  ({ default: Pharmacy } = await import("../models/Pharmacy.js"));
} catch (_) {}

const MODEL_ROLE_MAP = {
  admin: "admin",
  user: "customer",
  hospital: "hospital",
  manufacturer: "manufacturer",
  franchise: "franchise",
  vendor: "vendor",
  doctor: "b2b",
  pharmacy: "pharmacy",
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const result = await findUserAcrossModels(userId);

    if (!result) {
      return res.status(401).json({
        message: "User does not exist or has been deleted",
      });
    }

    const docRole = result.userDoc.role;
    const mappedRole = MODEL_ROLE_MAP[result.userType] || "customer";

    req.user = result.userDoc;
    req.user.role = docRole || mappedRole;
    req.userType = result.userType;

    next();
  } catch (err) {
    console.error("Auth error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired, please login again",
      });
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
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id || payload._id;

    const result = await findUserAcrossModels(userId);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const docRole = result.userDoc.role;
    const mappedRole = MODEL_ROLE_MAP[result.userType] || "customer";

    req.user = result.userDoc;
    req.user.role = docRole || mappedRole;
    req.userType = result.userType;

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      req.user = null;
      return next();
    }

    const result = await findUserAcrossModels(userId);

    if (!result) {
      req.user = null;
      return next();
    }

    const docRole = result.userDoc.role;
    const mappedRole = MODEL_ROLE_MAP[result.userType] || "customer";

    req.user = result.userDoc;
    req.user.role = docRole || mappedRole;
    req.userType = result.userType;

    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.userType !== "admin" && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

export const protectAgent = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const agentId =
      decoded.id ||
      decoded._id ||
      decoded.agentId ||
      decoded.userId;

    if (!agentId) {
      return res.status(401).json({
        message: "Token payload missing agent ID",
      });
    }

    const agent = await MarketingAgent.findById(agentId).select(
      "_id name email phone role permissions reportsTo teamMembers level isApproved"
    );

    if (!agent) {
      return res.status(401).json({ message: "Agent not found" });
    }

    if (!agent.isApproved) {
      return res.status(403).json({ message: "Agent is not approved" });
    }

    req.user = {
      id: agent._id.toString(),
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role || "marketing_agent",
      permissions: agent.permissions || {},
      reportsTo: agent.reportsTo,
      teamMembers: agent.teamMembers || [],
      level: agent.level || 1,
      userType: "marketing_agent",
    };

    req.userType = "marketing_agent";

    next();
  } catch (error) {
    console.log("JWT VERIFY ERROR =>", error.message);
    return res.status(401).json({ message: "Token failed" });
  }
};

export const requireAgentPermission = (permissionKey) => {
  return (req, res, next) => {
    if (req.user?.permissions?.[permissionKey]) {
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission to access this module",
    });
  };
};
