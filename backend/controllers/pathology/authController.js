import jwt from "jsonwebtoken";
import Lab from "../../models/pathology/Lab.js";

/**
 * VERIFY TOKEN / GET LOGGED-IN LAB
 */
export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const lab = await Lab.findById(decoded.id).select("-password");
    if (!lab) {
      return res.status(404).json({ message: "Lab not found" });
    }

    res.json({
      message: "Token is valid",
      lab,
    });
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
