import jwt from "jsonwebtoken";
import BulkManufacturingAccount from "../models/BulkManufacturingAccount.js";

const bulkManufacturingAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const account = await BulkManufacturingAccount.findById(decoded.id);

    if (!account) {
      return res
        .status(401)
        .json({ message: "Bulk manufacturing account not found" });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Bulk manufacturing account is inactive or blocked",
      });
    }

    req.bulkManufacturingAccount = account;
    next();
  } catch (error) {
    console.error("Bulk manufacturing auth error:", error.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export default bulkManufacturingAuth;
