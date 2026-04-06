import FranchiseAccount from "../models/FranchiseAccount.js";
import Franchise from "../models/Franchise.js";
import bcrypt from "bcryptjs";

/**
 * @desc   Get Franchise Profile
 * @route  GET /api/franchise/profile
 */
export const getFranchiseProfile = async (req, res) => {
  try {
    const account = await FranchiseAccount.findById(req.franchise._id).populate(
      "zoneId",
      "name status pincodes"
    );

    if (!account) {
      return res.status(404).json({ message: "Franchise account not found" });
    }

    const application = await Franchise.findById(
      account.franchiseApplicationId
    );

    res.json({
      success: true,
      profile: {
        email: account.email,
        status: account.status,
        zoneId: account.zoneId,
        application
      }
    });
  } catch (err) {
    console.error("Profile Fetch Error", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

/**
 * @desc   Update Franchise Profile
 * @route  PUT /api/franchise/profile
 */
export const updateFranchiseProfile = async (req, res) => {
  try {
    const account = req.franchise;

    const {
      fullName,
      mobile,
      locality,
      citiesOfInterest,
      investmentBandwidth,
      whyBioburg,
      marketConnect,
      locationType,
      documents,
    } = req.body;

    const application = await Franchise.findById(account.franchiseApplicationId);

    if (!application) {
      return res.status(404).json({ message: "Franchise application not found" });
    }

    const updates = {
      fullName,
      mobile,
      locality,
      citiesOfInterest,
      investmentBandwidth,
      whyBioburg,
      marketConnect,
      locationType,
    };

    if (documents && Object.keys(documents).length > 0) {
      updates.documents = {
        ...(application.documents || {}),
        ...documents,
      };
      updates.kycStatus = "UNDER_REVIEW";
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    await Franchise.findByIdAndUpdate(
      application._id,
      updates,
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (err) {
    console.error("Profile Update Error", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

/**
 * @desc   Change Password
 * @route  PUT /api/franchise/profile/password
 */
export const changeFranchisePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const account = await FranchiseAccount.findById(req.franchise._id);

    if (!account) {
      return res.status(404).json({ message: "Franchise account not found" });
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const match = await bcrypt.compare(oldPassword, account.password);
    if (!match) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from old password",
      });
    }

    account.password = await bcrypt.hash(newPassword, 10);
    await account.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (err) {
    console.error("Password Change Error", err);
    res.status(500).json({ message: "Password change failed" });
  }
};
