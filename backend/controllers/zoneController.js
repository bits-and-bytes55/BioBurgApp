// controllers/zoneController.js
import Zone from "../models/Zone.js";

export const createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    res.json({
      success: true,
      zone
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllZones = async (req, res) => {
  try {
    const zones = await Zone.find({ status: "ACTIVE" });
    res.json({
      success: true,
      zones
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
