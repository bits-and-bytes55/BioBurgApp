import jwt from "jsonwebtoken";
import Lab from "../../models/pathology/Lab.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX: decoded.labId (NOT decoded.id)
    const lab = await Lab.findById(decoded.labId).select("-password");

    if (!lab) {
      return res.status(401).json({ message: "Invalid token user" });
    }

    req.lab = lab;              // full lab object
    req.userId = lab._id;
    req.role = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalid or expired",
    });
  }
};
