// controllers/franchiseAdminController.js
import Franchise from "../models/Franchise.js";
import FranchiseAccount from "../models/FranchiseAccount.js";
import bcrypt from "bcryptjs";

export const approveFranchise = async (req, res) => {
  try {
    const { franchiseId, zoneId } = req.body;

    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    if (franchise.status === "APPROVED") {
      return res.status(400).json({ message: "Already approved" });
    }

    // Update existing Franchise model
    franchise.status = "APPROVED";
    franchise.zoneId = zoneId;
    await franchise.save();

    //  Create login account (only once)
    const exists = await FranchiseAccount.findOne({
      franchiseApplicationId: franchise._id
    });

    if (!exists) {
      const hashedPassword = await bcrypt.hash("Temp@123", 10);

      await FranchiseAccount.create({
        franchiseApplicationId: franchise._id,
        email: franchise.email,
        password: hashedPassword,
        zoneId
      });
    }

    res.json({
      success: true,
      message: "Franchise approved using existing model",
      tempPassword: "Temp@123"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
