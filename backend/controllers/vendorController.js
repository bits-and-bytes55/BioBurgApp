import Vendor from "../models/Vendor.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import cloudinary from "../config/cloudinary.js";

const uploadDoc = async (base64) => {
  if (!base64 || !base64.startsWith("data:")) return "";
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "vendor-docs",
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (err) {
    console.error("Doc upload failed:", err.message);
    return "";
  }
};

export const registerVendor = async (req, res) => {
  try {
    const data = req.body;

    if (!data.fullName || !data.email || !data.mobile || !data.password || !data.businessName) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    if (data.password !== data.confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const exists = await Vendor.findOne({
      $or: [{ email: data.email }, { phone: data.mobile }],
    });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email or phone already exists" });
    }

    // Upload all documents to Cloudinary
    const [
      gstCertificate, pancard, businessLogo,
      drugLicense1, drugLicense2, drugLicense3, drugLicense4,
      additionalDocument, ownerPhoto, aadharCard, voterId,
      educationCertificate, shopPhoto1, shopPhoto2, shopPhoto3,
      shopPhoto4, shopPhoto5, shopVideo
    ] = await Promise.all([
      uploadDoc(data.gstCertificate),
      uploadDoc(data.pancard),
      uploadDoc(data.businessLogo),
      uploadDoc(data.drugLicense1),
      uploadDoc(data.drugLicense2),
      uploadDoc(data.drugLicense3),
      uploadDoc(data.drugLicense4),
      uploadDoc(data.additionalDocument),
      uploadDoc(data.ownerPhoto),
      uploadDoc(data.aadharCard),
      uploadDoc(data.voterId),
      uploadDoc(data.educationCertificate),
      uploadDoc(data.shopPhoto1),
      uploadDoc(data.shopPhoto2),
      uploadDoc(data.shopPhoto3),
      uploadDoc(data.shopPhoto4),
      uploadDoc(data.shopPhoto5),
      uploadDoc(data.shopVideo),
    ]);

    const vendor = await Vendor.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.mobile,
      altPhone: data.altPhone,
      gender: data.gender,
      dob: data.dob,
      password: data.password,
      businessName: data.businessName,
      businessType: data.businessType,
      registrationType: data.registrationType,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      drugLicenseNumber1: data.drugLicenseNumber1,
      drugLicenseNumber2: data.drugLicenseNumber2,
      drugLicenseNumber3: data.drugLicenseNumber3,
      drugLicenseNumber4: data.drugLicenseNumber4,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      branchName: data.branchName,
      isWholesaler: data.isWholesaler,
      businessInterest: data.businessInterest,
      investmentBandwidth: data.investmentBandwidth,
      agreementRating: data.agreementRating,
      additionalSupport: Array.isArray(data.additionalSupport) ? data.additionalSupport : JSON.parse(data.additionalSupport || "[]"),
      existingStoreDetails: data.existingStoreDetails,
      challenges: Array.isArray(data.challenges) ? data.challenges : JSON.parse(data.challenges || "[]"),
      businessModel: data.businessModel,
      investmentTimeline: data.investmentTimeline,
      roiExpectation: data.roiExpectation,
      investmentCapacity: data.investmentCapacity,
      interestMultipleWholesaler: data.interestMultipleWholesaler,
      numStoresPlanning: data.numStoresPlanning,
      appealingAspects: Array.isArray(data.appealingAspects) ? data.appealingAspects : JSON.parse(data.appealingAspects || "[]"),
      nearbyCompetition: data.nearbyCompetition,
      whyInterested: data.whyInterested,
      legalDisputes: data.legalDisputes,
      citiesOfInterest: data.citiesOfInterest,
      locality: data.locality,
      marketConnect: data.marketConnect,
      locationType: data.locationType,
      comments: data.comments,
      gstCertificate, pancard, businessLogo,
      drugLicense1, drugLicense2, drugLicense3, drugLicense4,
      additionalDocument, ownerPhoto, aadharCard, voterId,
      educationCertificate, shopPhoto1, shopPhoto2, shopPhoto3,
      shopPhoto4, shopPhoto5, shopVideo,
      isApproved: false,
    });

    return res.status(201).json({
      success: true,
      message: "Vendor registered successfully. Awaiting admin approval.",
      vendorId: vendor._id,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
/**
 * POST /api/vendor/login
 */
export const loginVendor = async (req, res) => {
  try {
    const { email, drugLicenseNumber1, password } = req.body;

    if (!email || !drugLicenseNumber1 || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, Drug License Number and Password required",
      });
    }

    const vendor = await Vendor.findOne({ email, drugLicenseNumber1 }).select(
      "+password",
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Invalid login details",
      });
    }

    if (!vendor.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Admin approval pending",
      });
    }

    const isMatch = await vendor.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    const token = jwt.sign(
      { id: vendor._id, role: vendor.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      vendor,
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id).select("-password"); 

    if (!vendor)
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });

    return res.json({ success: true, vendor });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user._id; 

    let updateData = { ...req.body };

    // ------------------ HANDLE DOCUMENT UPLOADS ------------------
    if (req.files?.gstCertificate) {
      updateData.gstCertificate = req.files.gstCertificate[0].path;
    }
    if (req.files?.drugLicense1) {
      updateData.drugLicense1 = req.files.drugLicense1[0].path;
    }
    if (req.files?.drugLicense2) {
      updateData.drugLicense2 = req.files.drugLicense2[0].path;
    }
    if (req.files?.drugLicense3) {
      updateData.drugLicense3 = req.files.drugLicense3[0].path;
    }
    if (req.files?.drugLicense4) {
      updateData.drugLicense4 = req.files.drugLicense4[0].path;
    }
    if (req.files?.pancard) {
      updateData.pancard = req.files.pancard[0].path;
    }
    if (req.files?.businessLogo) {
      updateData.businessLogo = req.files.businessLogo[0].path;
    }
    if (req.files?.ownerPhoto) {
      updateData.ownerPhoto = req.files.ownerPhoto[0].path;
    }
    if (req.files?.additionalDocument) {
      updateData.additionalDocument = req.files.additionalDocument[0].path;
    }

    // ------------------ PREVENT UPDATING FIELDS ------------------
    delete updateData.email; // email not editable
    delete updateData.password; // password change different route
    delete updateData.role;
    delete updateData.isApproved;

    // ------------------ UPDATE VENDOR ------------------
    const updatedVendor = await Vendor.findByIdAndUpdate(vendorId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.json({
      success: true,
      message: "Profile updated successfully",
      vendor: updatedVendor,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const updateVendorPassword = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id).select("+password");

    const { currentPassword, newPassword } = req.body;

    const isMatch = await vendor.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password incorrect" });
    }

    vendor.password = newPassword;
    await vendor.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

let otpStore = {};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "No vendor found with this email",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    // SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // VERIFY SMTP CONNECTION
    transporter.verify((error, success) => {
      if (error) {
        console.log("SMTP ERROR:", error);
      } else {
        console.log("SMTP is ready to send emails");
      }
    });

    // SEND EMAIL
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`,
    });

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.log("FORGOT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (otpStore[email] !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const vendor = await Vendor.findOne({ email }).select("+password");
    vendor.password = newPassword;
    await vendor.save();

    delete otpStore[email];

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.log("RESET ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
