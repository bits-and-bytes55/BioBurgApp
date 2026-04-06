import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Manufacturer from "../models/Manufacturer.js";

const generateToken = (id) =>
  jwt.sign({ id, role: "MANUFACTURER" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeUsername = (value) => String(value || "").trim().toLowerCase();

const parseArrayField = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const buildFilePayload = (file) =>
  file
    ? {
        url: file.path,
        originalName: file.originalname,
      }
    : null;

export const buildManufacturerPayload = (manufacturer) => ({
  id: manufacturer._id.toString(),
  fullName: manufacturer.fullName || "",
  companyName: manufacturer.companyName || "",
  companyType: manufacturer.companyType || "",
  yearEst: manufacturer.yearEst || "",
  corpRegNum: manufacturer.corpRegNum || "",
  headOfficeAddress: manufacturer.headOfficeAddress || "",
  factoryAddress: manufacturer.factoryAddress || "",
  officialEmail: manufacturer.officialEmail || "",
  officialContact: manufacturer.officialContact || "",
  username: manufacturer.username || "",
  personalMobile: manufacturer.personalMobile || "",
  authName: manufacturer.authName || "",
  authDesignation: manufacturer.authDesignation || "",
  authMobile: manufacturer.authMobile || "",
  authEmail: manufacturer.authEmail || "",
  productTypes: manufacturer.productTypes || [],
  productionCapacity: manufacturer.productionCapacity || "",
  licenseNumber: manufacturer.licenseNumber || "",
  qualityCerts: manufacturer.qualityCerts || [],
  mfgAccepted: manufacturer.mfgAccepted || [],
  moq: manufacturer.moq || "",
  businessTerms: manufacturer.businessTerms || "",
  bankName: manufacturer.bankName || "",
  accountHolder: manufacturer.accountHolder || "",
  accountNumber: manufacturer.accountNumber || "",
  ifscCode: manufacturer.ifscCode || "",
  paymentMethod: manufacturer.paymentMethod || "",
  documents: manufacturer.documents || {},
  isVerified: Boolean(manufacturer.isVerified),
  applicationStatus: manufacturer.applicationStatus || "PENDING",
  documentReviewStatus: manufacturer.documentReviewStatus || "PENDING",
  accountStatus: manufacturer.accountStatus || "PENDING_APPROVAL",
  reviewNotes: manufacturer.reviewNotes || "",
  rejectionReason: manufacturer.rejectionReason || "",
  createdAt: manufacturer.createdAt,
  updatedAt: manufacturer.updatedAt,
  lastLoginAt: manufacturer.lastLoginAt || null,
});

export const registerManufacturer = async (req, res) => {
  try {
    const officialEmail = normalizeEmail(req.body.officialEmail);
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");

    if (!officialEmail || !password || !req.body.companyName || !req.body.fullName) {
      return res.status(400).json({
        message:
          "Full name, company name, official email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const emailExists = await Manufacturer.findOne({ officialEmail });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (username) {
      const usernameExists = await Manufacturer.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manufacturer = await Manufacturer.create({
      fullName: req.body.fullName || "",
      gender: req.body.gender || "",
      dob: req.body.dob || "",
      personalMobile: req.body.personalMobile || "",
      companyName: req.body.companyName || "",
      companyType: req.body.companyType || "",
      yearEst: req.body.yearEst || "",
      corpRegNum: req.body.corpRegNum || "",
      headOfficeAddress: req.body.headOfficeAddress || "",
      factoryAddress: req.body.factoryAddress || "",
      officialEmail,
      officialContact: req.body.officialContact || "",
      username: username || undefined,
      authName: req.body.authName || "",
      authDesignation: req.body.authDesignation || "",
      authMobile: req.body.authMobile || "",
      authEmail: req.body.authEmail || "",
      productTypes: parseArrayField(req.body.productTypes),
      productionCapacity: req.body.productionCapacity || "",
      licenseNumber: req.body.licenseNumber || "",
      qualityCerts: parseArrayField(req.body.qualityCerts),
      mfgAccepted: parseArrayField(req.body.mfgAccepted),
      moq: req.body.moq || "",
      businessTerms: req.body.businessTerms || "",
      bankName: req.body.bankName || "",
      accountHolder: req.body.accountHolder || "",
      accountNumber: req.body.accountNumber || "",
      ifscCode: req.body.ifscCode || "",
      paymentMethod: req.body.paymentMethod || "",
      password: hashedPassword,
      documents: {
        licenseFile: buildFilePayload(req.files?.licenseFile?.[0]),
        gmpCertFile: buildFilePayload(req.files?.gmpCertFile?.[0]),
        isoCertFile: buildFilePayload(req.files?.isoCertFile?.[0]),
        productListFile: buildFilePayload(req.files?.productListFile?.[0]),
        qualityTestDocs: buildFilePayload(req.files?.qualityTestDocs?.[0]),
      },
      isVerified: false,
      applicationStatus: "PENDING",
      documentReviewStatus: "PENDING",
      accountStatus: "PENDING_APPROVAL",
    });

    return res.status(201).json({
      success: true,
      message:
        "Manufacturer application submitted successfully. You can log in after admin approval.",
      manufacturer: buildManufacturerPayload(manufacturer),
    });
  } catch (err) {
    console.error("Manufacturer registration error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

export const loginManufacturer = async (req, res) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginId = normalizeUsername(identifier || email || username);

    if (!loginId || !password) {
      return res.status(400).json({
        message: "Login ID and password are required.",
      });
    }

    const manufacturer = await Manufacturer.findOne({
      $or: [{ officialEmail: loginId }, { username: loginId }],
    });

    if (!manufacturer) {
      return res.status(400).json({ message: "Manufacturer not found" });
    }

    const isMatch = await bcrypt.compare(password, manufacturer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (manufacturer.accountStatus === "BLOCKED") {
      return res.status(403).json({
        message: "Manufacturer account is blocked. Please contact admin.",
      });
    }

    const isApproved =
      manufacturer.isVerified ||
      manufacturer.applicationStatus === "APPROVED" ||
      manufacturer.accountStatus === "ACTIVE";

    if (!isApproved) {
      if (manufacturer.applicationStatus === "REJECTED") {
        return res.status(403).json({
          message:
            manufacturer.rejectionReason ||
            "Your manufacturer application was rejected by admin.",
        });
      }

      return res.status(403).json({
        message: "Your manufacturer application is pending admin approval.",
      });
    }

    manufacturer.isVerified = true;
    manufacturer.applicationStatus = "APPROVED";
    manufacturer.accountStatus = "ACTIVE";
    manufacturer.lastLoginAt = new Date();
    await manufacturer.save();

    return res.json({
      success: true,
      token: generateToken(manufacturer._id),
      manufacturer: buildManufacturerPayload(manufacturer),
    });
  } catch (err) {
    console.error("Manufacturer login error:", err);
    return res.status(500).json({ message: "Unable to login right now." });
  }
};

export const getManufacturerProfile = async (req, res) => {
  return res.json({
    success: true,
    manufacturer: buildManufacturerPayload(req.manufacturer),
  });
};

export const updateManufacturerProfile = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.manufacturer._id);

    if (!manufacturer) {
      return res.status(404).json({ message: "Manufacturer not found." });
    }

    const fieldsToUpdate = [
      "fullName",
      "personalMobile",
      "companyName",
      "companyType",
      "yearEst",
      "corpRegNum",
      "headOfficeAddress",
      "factoryAddress",
      "officialContact",
      "authName",
      "authDesignation",
      "authMobile",
      "authEmail",
      "productionCapacity",
      "moq",
      "businessTerms",
      "bankName",
      "accountHolder",
      "accountNumber",
      "ifscCode",
      "paymentMethod",
    ];

    fieldsToUpdate.forEach((fieldName) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, fieldName)) {
        manufacturer[fieldName] = req.body[fieldName] ?? manufacturer[fieldName];
      }
    });

    await manufacturer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      manufacturer: buildManufacturerPayload(manufacturer),
    });
  } catch (err) {
    console.error("Manufacturer profile update error:", err);
    return res.status(500).json({
      message: "Unable to update manufacturer profile.",
    });
  }
};

export const changeManufacturerPassword = async (req, res) => {
  try {
    const { currentPassword = "", newPassword = "", confirmPassword = "" } =
      req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password, and confirm password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match.",
      });
    }

    const manufacturer = await Manufacturer.findById(req.manufacturer._id);
    if (!manufacturer) {
      return res.status(404).json({ message: "Manufacturer not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, manufacturer.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password.",
      });
    }

    manufacturer.password = await bcrypt.hash(newPassword, 10);
    await manufacturer.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Manufacturer password change error:", err);
    return res.status(500).json({
      message: "Unable to update password.",
    });
  }
};

export const getManufacturerDashboard = async (req, res) => {
  const manufacturer = req.manufacturer;
  const uploadedDocuments = Object.values(manufacturer.documents || {}).filter(
    (file) => Boolean(file?.url),
  ).length;

  return res.json({
    success: true,
    summary: {
      applicationStatus: manufacturer.applicationStatus || "PENDING",
      documentReviewStatus: manufacturer.documentReviewStatus || "PENDING",
      accountStatus: manufacturer.accountStatus || "PENDING_APPROVAL",
      totalCapabilities: (manufacturer.productTypes || []).length,
      qualityCertifications: (manufacturer.qualityCerts || []).length,
      contractModes: (manufacturer.mfgAccepted || []).length,
      uploadedDocuments,
      bankingConfigured: Boolean(
        manufacturer.bankName &&
          manufacturer.accountHolder &&
          manufacturer.accountNumber,
      ),
    },
    manufacturer: buildManufacturerPayload(manufacturer),
  });
};
