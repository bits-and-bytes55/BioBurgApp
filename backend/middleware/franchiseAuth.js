import jwt from "jsonwebtoken";
import FranchiseAccount from "../models/FranchiseAccount.js";

const franchiseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // NOW decoded.id IS STRING
    const franchise = await FranchiseAccount.findById(decoded.id);

    if (!franchise) {
      return res.status(401).json({ message: "Franchise not found" });
    }

    if (franchise.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Franchise account is blocked or inactive",
      });
    }

    req.franchise = franchise;
    next();
  } catch (err) {
    console.error("Franchise Auth Error:", err.message);
    res.status(401).json({ message: "Token invalid or expired" });
  }
};


export default franchiseAuth;
