// backend/middleware/adminAuth.js
console.log("JWT SECRET:", process.env.JWT_SECRET);
import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";


let Vendor = null;
try {
  const mod = await import("../models/Vendor.js");
  Vendor = mod.default;
} catch (_) {}

export const adminProtect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token)
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED TOKEN:", decoded);

    // ── 1. Try Admin first ─────────────────────────────────────────────
    const admin = await Admin.findById(decoded.id).select("-password");

    if (admin) {
      req.admin     = admin;
      req.user      = admin;
      req.user.id   = String(admin._id);
      req.user.role = "admin";
      return next();
    }

    // ── 2. Try Vendor 
    // This was missing before — vendor tokens were getting 404 because
    // Admin.findById() returned null and the middleware rejected them.
    if (Vendor) {
      const vendor = await Vendor.findById(decoded.id).select("-password");
      if (vendor) {
        req.admin     = vendor;          
        req.user      = vendor;
        req.user.id   = String(vendor._id);
        req.user.role = "vendor";
        return next();
      }
    }

    // ── 3. Neither admin nor vendor found 
    console.log("No admin or vendor found for decoded ID:", decoded.id);
    return res.status(404).json({ message: "Admin not found" });

  } catch (error) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export default adminProtect;