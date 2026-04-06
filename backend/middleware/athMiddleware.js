// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import Vendor from "../models/Vendor.js";

export const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      let token;

      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      if (!token) return res.status(401).json({ success: false, message: "Not authorized, no token" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await Vendor.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ success: false, message: "User not found" });

      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ success: false, message: "Not authorized or token invalid" });
    }
  };
};
