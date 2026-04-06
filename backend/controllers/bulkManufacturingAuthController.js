import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import BulkManufacturingAccount from "../models/BulkManufacturingAccount.js";
import BulkManufacturingRequest from "../models/BulkManufacturingRequest.js";

const RESET_OTP_EXPIRY_MS = 10 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasEmailConfig = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const findBulkManufacturingAccount = async (identifier) => {
  const normalizedIdentifier = String(identifier || "").trim();

  if (!normalizedIdentifier) {
    return null;
  }

  const regex = new RegExp(`^${escapeRegex(normalizedIdentifier)}$`, "i");

  return BulkManufacturingAccount.findOne({
    $or: [{ email: regex }, { username: regex }],
  });
};

const findBulkManufacturingAccountByEmail = async (email) => {
  const normalizedEmail = String(email || "").trim();

  if (!normalizedEmail) {
    return null;
  }

  const exactMatch = await BulkManufacturingAccount.findOne({
    email: normalizedEmail.toLowerCase(),
  });
  if (exactMatch) {
    return exactMatch;
  }

  return BulkManufacturingAccount.findOne({
    email: {
      $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i"),
    },
  });
};

const buildAccountPayload = async (account) => {
  const request = await BulkManufacturingRequest.findById(account.requestId)
    .select(
      "fullName companyName status documentReviewStatus documentReviewNotes products quantity destinationCountry createdAt documents",
    )
    .lean();

  return {
    id: account._id.toString(),
    username: account.username,
    email: account.email,
    role: account.role,
    status: account.status,
    companyName: account.companyName,
    contactName: account.contactName,
    mobile: account.mobile,
    country: account.country,
    website: account.website,
    request,
  };
};

export const bulkManufacturingLogin = async (req, res) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginIdentifier = identifier || email || username;

    if (!loginIdentifier || !password) {
      return res
        .status(400)
        .json({ message: "Login ID and password are required." });
    }

    const account = await findBulkManufacturingAccount(loginIdentifier);

    if (!account) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    const isMatch = await bcrypt.compare(password, account.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Bulk manufacturing account is inactive or blocked.",
      });
    }

    account.lastLoginAt = new Date();
    await account.save();

    const token = jwt.sign(
      {
        id: account._id.toString(),
        role: account.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      success: true,
      token,
      account: await buildAccountPayload(account),
    });
  } catch (error) {
    console.error("Bulk manufacturing login error:", error);
    return res.status(500).json({
      message: "Unable to login right now.",
    });
  }
};

export const getBulkManufacturingMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      account: await buildAccountPayload(req.bulkManufacturingAccount),
    });
  } catch (error) {
    console.error("Bulk manufacturing me error:", error);
    return res.status(500).json({
      message: "Unable to load session details.",
    });
  }
};

export const forgotBulkManufacturingPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const account = await findBulkManufacturingAccountByEmail(email);
    if (!account) {
      return res.status(404).json({
        message: "No bulk manufacturing account found for this email.",
      });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Bulk manufacturing account is inactive or blocked.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.resetPasswordOtp = otp;
    account.resetPasswordExpire = new Date(Date.now() + RESET_OTP_EXPIRY_MS);
    await account.save();

    if (hasEmailConfig()) {
      await transporter.sendMail({
        from: `"BioBurg Bulk Manufacturing" <${process.env.EMAIL_USER}>`,
        to: account.email,
        subject: "Bulk Manufacturing Password Reset OTP",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px">
            <h2 style="margin:0 0 12px;color:#0f766e">Bulk Manufacturing Password Reset</h2>
            <p style="margin:0 0 16px;color:#334155">Use the OTP below to reset your BioBurg bulk manufacturing portal password.</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;margin:20px 0">${otp}</div>
            <p style="margin:0;color:#64748b">This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent to your registered email.",
      });
    }

    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({
        message:
          "Email configuration missing. Please set EMAIL_USER and EMAIL_PASS.",
      });
    }

    console.warn(
      `Bulk manufacturing OTP generated for local testing only: ${account.email} -> ${otp}`,
    );

    return res.status(200).json({
      success: true,
      message:
        "Email credentials are not configured. OTP generated for local testing only.",
      debugOtp: otp,
    });
  } catch (error) {
    console.error("Bulk manufacturing forgot password error:", error);
    return res.status(500).json({
      message: "Failed to send OTP.",
    });
  }
};

export const resetBulkManufacturingPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required.",
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters.",
      });
    }

    const account = await findBulkManufacturingAccountByEmail(email);
    if (!account) {
      return res.status(404).json({
        message: "Bulk manufacturing account not found.",
      });
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
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, account.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    account.password = await bcrypt.hash(newPassword, 10);
    account.resetPasswordOtp = undefined;
    account.resetPasswordExpire = undefined;
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Bulk manufacturing reset password error:", error);
    return res.status(500).json({
      message: "Failed to reset password.",
    });
  }
};
