import jwt from "jsonwebtoken";
import Manufacturer from "../models/Manufacturer.js";

export const protectManufacturer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.manufacturer = await Manufacturer.findById(decoded.id).select("-password");

    if (!req.manufacturer) {
      return res.status(401).json({ message: "Invalid token" });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
