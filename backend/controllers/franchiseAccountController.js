import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import FranchiseAccount from "../models/FranchiseAccount.js";
import Franchise from "../models/Franchise.js";

const RESET_OTP_EXPIRY_MS = 10 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findFranchiseAccountByEmail = async (email) => {
  const normalizedEmail = String(email || "").trim();

  if (!normalizedEmail) {
    return null;
  }

  const exactMatch = await FranchiseAccount.findOne({ email: normalizedEmail });
  if (exactMatch) {
    return exactMatch;
  }

  return FranchiseAccount.findOne({
    email: {
      $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i"),
    },
  });
};

const hasEmailConfig = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

export const franchiseLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findFranchiseAccountByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid login" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid login" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Franchise account is blocked or inactive",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        zoneId: user.zoneId?.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const [application, zone] = await Promise.all([
      Franchise.findById(user.franchiseApplicationId).select(
        "fullName mobile email citiesOfInterest locality"
      ),
      user.zoneId
        ? FranchiseAccount.populate(user, {
            path: "zoneId",
            select: "name status",
          }).then((account) => account.zoneId)
        : null,
    ]);

    const zoneId =
      zone?._id?.toString() || user.zoneId?._id?.toString() || user.zoneId?.toString() || null;

    res.json({
      success: true,
      token,
      account: {
        id: user._id.toString(),
        email: user.email,
        fullName: application?.fullName || "",
        status: user.status,
        zoneId,
        zoneName: zone?.name || "",
        application,
      },
    });
  } catch (error) {
    console.error("Franchise Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

export const forgotFranchisePassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const account = await findFranchiseAccountByEmail(email);
    if (!account) {
      return res.status(404).json({ message: "No franchise account found for this email" });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Franchise account is blocked or inactive",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.resetPasswordOtp = otp;
    account.resetPasswordExpire = new Date(Date.now() + RESET_OTP_EXPIRY_MS);
    await account.save();

    if (hasEmailConfig()) {
      await transporter.sendMail({
        from: `"BioBurg Franchise" <${process.env.EMAIL_USER}>`,
        to: account.email,
        subject: "Franchise Password Reset OTP",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px">
            <h2 style="margin:0 0 12px;color:#0f766e">Franchise Password Reset</h2>
            <p style="margin:0 0 16px;color:#334155">Use the OTP below to reset your BioBurg franchise password.</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;margin:20px 0">${otp}</div>
            <p style="margin:0;color:#64748b">This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });

      return res.json({
        success: true,
        message: "OTP sent to your registered email",
      });
    }

    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({
        message: "Email configuration missing. Please set EMAIL_USER and EMAIL_PASS.",
      });
    }

    console.warn(
      `Franchise OTP generated for local testing only: ${account.email} -> ${otp}`
    );

    return res.json({
      success: true,
      message:
        "Email credentials are not configured. OTP generated for local testing only.",
      debugOtp: otp,
    });
  } catch (error) {
    console.error("Franchise Forgot Password Error:", error);

    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const resetFranchisePassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const account = await findFranchiseAccountByEmail(email);
    if (!account) {
      return res.status(404).json({ message: "Franchise account not found" });
    }

    if (!account.resetPasswordOtp || !account.resetPasswordExpire) {
      return res.status(400).json({
        message: "OTP not found. Please request a new one.",
      });
    }

    if (Date.now() > new Date(account.resetPasswordExpire).getTime()) {
      account.resetPasswordOtp = undefined;
      account.resetPasswordExpire = undefined;
      await account.save();

      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (String(account.resetPasswordOtp) !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, account.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from the current password",
      });
    }

    account.password = await bcrypt.hash(newPassword, 10);
    account.resetPasswordOtp = undefined;
    account.resetPasswordExpire = undefined;
    await account.save();

    res.json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Franchise Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
