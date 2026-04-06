// controllers/hospitalController.js

import Hospital          from "../models/Hospital.js";
import HospitalDashboard from "../models/hospitalDashboard.js";
import Order             from "../models/Order.js";
import jwt               from "jsonwebtoken";
import nodemailer        from "nodemailer";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";

const otpStore = new Map();

// ── Email transporter 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export const VALID_SECTIONS = [
  "patients",
  "appointments",
  "doctors",
  "departments",
  "lab",
  "pharmacy",
  "billing",
  "inventory",
  "staff",
  "prescriptions",
];

const EMPTY_DASHBOARD = {
  patients:      [],
  appointments:  [],
  doctors:       [],
  departments:   [],
  lab:           [],
  pharmacy:      [],
  billing:       [],
  inventory:     [],
  staff:         [],
  prescriptions: [],
};

function safeDashboard(doc) {
  return {
    patients:      Array.isArray(doc.patients)      ? doc.patients      : [],
    appointments:  Array.isArray(doc.appointments)  ? doc.appointments  : [],
    doctors:       Array.isArray(doc.doctors)       ? doc.doctors       : [],
    departments:   Array.isArray(doc.departments)   ? doc.departments   : [],
    lab:           Array.isArray(doc.lab)           ? doc.lab           : [],
    pharmacy:      Array.isArray(doc.pharmacy)      ? doc.pharmacy      : [],
    billing:       Array.isArray(doc.billing)       ? doc.billing       : [],
    inventory:     Array.isArray(doc.inventory)     ? doc.inventory     : [],
    staff:         Array.isArray(doc.staff)         ? doc.staff         : [],
    prescriptions: Array.isArray(doc.prescriptions) ? doc.prescriptions : [],
  };
}

// ── Login notification emails 
async function sendLoginNotification(facility, ip) {
  try {
    const loginTime  = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const rows = [
      ["Hospital",       facility.facilityName],
      ["Contact Person", facility.contactPerson],
      ["Email",          facility.email],
      ["Phone",          facility.phone],
      ["City / State",   `${facility.city}, ${facility.state}`],
      ["Login Time",     loginTime],
      ["IP Address",     ip || "Unknown"],
      ["Login Count",    facility.loginCount],
    ].map(([l, v], i) =>
      `<tr style="${i % 2 === 0 ? "background:#f8fafc" : ""}">
        <td style="padding:10px 14px;font-weight:700;color:#64748b;width:40%">${l}</td>
        <td style="padding:10px 14px;color:#0f172a;font-weight:600">${v}</td>
      </tr>`
    ).join("");

    // Email to admin
    await transporter.sendMail({
      from:    `"BioBurg HMS" <${process.env.EMAIL_USER}>`,
      to:      adminEmail,
      subject: `Hospital Login Alert — ${facility.facilityName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
          <div style="background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px">
            <h2 style="margin:0;font-size:18px">Hospital Login Notification</h2>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table>
        </div>`,
    });

    // Confirmation email to hospital
    await transporter.sendMail({
      from:    `"BioBurg HMS" <${process.env.EMAIL_USER}>`,
      to:      facility.email,
      subject: `Login Successful — ${facility.facilityName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#0369a1">Login Successful</h2>
          <p>Hello <strong>${facility.contactPerson}</strong>,</p>
          <p>Your BioBurg HMS account was accessed successfully.</p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 18px;margin:16px 0">
            <div style="font-size:13px;color:#0369a1"><strong>Time:</strong> ${loginTime}</div>
            <div style="font-size:13px;color:#0369a1;margin-top:4px"><strong>IP:</strong> ${ip || "Unknown"}</div>
          </div>
          <p style="color:#64748b;font-size:12px">If this wasn't you, change your password immediately.</p>
        </div>`,
    });
  } catch (e) {
    // Never block login because of email failure
    console.warn("Login notification email failed:", e.message);
  }
}


export const registerHospital = async (req, res) => {
  try {
    const { email, registrationNumber, password, ...rest } = req.body;

    if (!email || !password || !registrationNumber) {
      return res.status(400).json({ success: false, message: "Email, password and registration number are required." });
    }

    const existing = await Hospital.findOne({ $or: [{ email }, { registrationNumber }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "Hospital with this email or registration number already exists." });
    }

    const facility = await Hospital.create({
      ...rest, email, registrationNumber, password,
      facilityType: "hospital", status: "pending", isApproved: false,
    });

    res.status(201).json({
      success: true,
      message: "Hospital registered! Awaiting admin approval.",
      facility: { id: facility._id, facilityName: facility.facilityName, email: facility.email, status: facility.status },
    });
  } catch (error) {
    console.error("Hospital registration error:", error);
    res.status(500).json({ success: false, message: error.message || "Registration failed." });
  }
};

export const loginHospital = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    const facility = await Hospital.findOne({ email }).select("+password");
    if (!facility) {
      return res.status(404).json({ success: false, message: "Invalid email or password." });
    }
    if (facility.status === "pending") {
      return res.status(403).json({ success: false, status: "pending",  message: "Account pending admin approval." });
    }
    if (facility.status === "rejected") {
      return res.status(403).json({ success: false, status: "rejected", message: "Registration rejected. Contact support." });
    }
    if (!facility.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated." });
    }

    const isMatch = await facility.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: facility._id, type: "hospital" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Track login metadata
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
               || req.socket?.remoteAddress
               || "Unknown";
    const loginCount = (facility.loginCount || 0) + 1;
    await Hospital.findByIdAndUpdate(facility._id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      loginCount,
    });

    await HospitalDashboard.findOneAndUpdate(
      { hospitalId: facility._id },
      { $setOnInsert: { hospitalId: facility._id, ...EMPTY_DASHBOARD } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    facility.loginCount = loginCount;
    sendLoginNotification(facility, ip).catch(console.warn);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      facility: {
        _id:                facility._id,
        id:                 facility._id,
        facilityName:       facility.facilityName,
        facilityType:       facility.facilityType,
        contactPerson:      facility.contactPerson,
        email:              facility.email,
        phone:              facility.phone,
        city:               facility.city,
        state:              facility.state,
        numberOfBeds:       facility.numberOfBeds,
        establishedYear:    facility.establishedYear,
        registrationNumber: facility.registrationNumber,
        licenseNumber:      facility.licenseNumber,
        isApproved:         facility.isApproved,
        status:             facility.status,
        profilePhotoUrl:    facility.profilePhotoUrl || null,
        themeColor:         facility.themeColor      || "#0369a1",
        themeMode:          facility.themeMode       || "light",
        themeName:          facility.themeName       || "default",
        token,
      },
    });
  } catch (error) {
    console.error("Hospital login error:", error);
    res.status(500).json({ success: false, message: "Login failed." });
  }
};

export const forgotHospitalPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const facility = await Hospital.findOne({ email });
    if (!facility) return res.status(404).json({ success: false, message: "No hospital registered with this email." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    await transporter.sendMail({
      from:    `"BioBurg" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: "Hospital Password Reset OTP",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#0077a3">Password Reset OTP</h2>
          <p>Your OTP for password reset is:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0077a3;margin:24px 0">${otp}</div>
          <p style="color:#94a3b8;font-size:13px">Valid for <strong>10 minutes</strong>. Do not share it.</p>
        </div>`,
    });

    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

export const resetHospitalPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP and new password are required." });
    }

    const stored = otpStore.get(email);
    if (!stored) return res.status(400).json({ success: false, message: "OTP not found. Request a new one." });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: "OTP expired." });
    }
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP." });

    const facility = await Hospital.findOne({ email }).select("+password");
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    facility.password = newPassword;
    await facility.save();
    otpStore.delete(email);

    res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};


export const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: hospitals.length, hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch hospitals." });
  }
};

export const getHospitalProfile = async (req, res) => {
  try {
    const facility = await Hospital.findById(req.user.id);
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });
    res.status(200).json({ success: true, facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
};

export const updateHospitalProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    // These fields must never change via profile update
    delete updates.password;
    delete updates.email;
    delete updates.registrationNumber;
    delete updates.status;
    delete updates.isApproved;

    const facility = await Hospital.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    res.status(200).json({ success: true, message: "Profile updated.", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

export const updateHospitalProfilePhoto = async (req, res) => {
  try {
    const { profilePhotoUrl, profilePhotoPublicId } = req.body;
    if (!profilePhotoUrl) return res.status(400).json({ success: false, message: "Photo URL required." });

    // Delete old photo from Cloudinary first
    const existing = await Hospital.findById(req.user.id).select("profilePhotoPublicId");
    if (existing?.profilePhotoPublicId) {
      await deleteFromCloudinary(existing.profilePhotoPublicId, "image").catch(console.warn);
    }

    const facility = await Hospital.findByIdAndUpdate(
      req.user.id,
      { profilePhotoUrl, profilePhotoPublicId },
      { new: true }
    );
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    res.status(200).json({ success: true, message: "Profile photo updated.", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update photo." });
  }
};

export const updateHospitalTheme = async (req, res) => {
  try {
    const { themeColor, themeMode, themeName } = req.body;
    const updates = {};
    if (themeColor) updates.themeColor = themeColor;
    if (themeMode)  updates.themeMode  = themeMode;
    if (themeName)  updates.themeName  = themeName;

    const facility = await Hospital.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    res.status(200).json({ success: true, message: "Theme updated.", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update theme." });
  }
};

export const updateHospitalPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const facility = await Hospital.findById(req.user.id).select("+password");
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    const isMatch = await facility.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect." });

    facility.password = newPassword;
    await facility.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update password." });
  }
};


export const getMyHospitalDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    // findOneAndUpdate with upsert guarantees the doc is always created if missing
    let dashboard = await HospitalDashboard.findOneAndUpdate(
      { hospitalId },
      { $setOnInsert: { hospitalId, ...EMPTY_DASHBOARD } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: safeDashboard(dashboard) });
  } catch (error) {
    console.error("Hospital dashboard fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard." });
  }
};


export const updateHospitalDashboardSection = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { section, data } = req.body;

    // Validate section name
    if (!section || !VALID_SECTIONS.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}`,
      });
    }

    // Data must be an array
    if (!Array.isArray(data)) {
      return res.status(400).json({ success: false, message: "data must be an array." });
    }

    // upsert:true — creates the dashboard doc if it somehow doesn't exist yet
    // runValidators:false — Mixed arrays don't need validation, avoids Mongoose issues
    const updated = await HospitalDashboard.findOneAndUpdate(
      { hospitalId },
      { $set: { [section]: data } },
      { new: true, upsert: true, runValidators: false, setDefaultsOnInsert: true }
    );

    if (!updated) {
      return res.status(500).json({ success: false, message: "Dashboard update failed — document not found." });
    }

    res.status(200).json({
      success: true,
      message: `${section} saved successfully.`,
      count: data.length,
    });
  } catch (error) {
    console.error("Dashboard section update error:", error);
    res.status(500).json({ success: false, message: `Failed to save ${req.body?.section || "section"}: ${error.message}` });
  }
};

export const getHospitalDashboard = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const dashboard  = await HospitalDashboard.findOne({ hospitalId });

    // If no data yet, return empty structure — don't 404
    res.status(200).json({
      success:   true,
      dashboard: dashboard ? safeDashboard(dashboard) : EMPTY_DASHBOARD,
    });
  } catch (error) {
    console.error("Admin dashboard fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data." });
  }
};

export const approveHospital = async (req, res) => {
  try {
    const facility = await Hospital.findByIdAndUpdate(
      req.params.id,
      { status: "approved", isApproved: true, approvedAt: new Date() },
      { new: true }
    );
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    // Ensure a dashboard doc exists for the newly approved hospital
    await HospitalDashboard.findOneAndUpdate(
      { hospitalId: facility._id },
      { $setOnInsert: { hospitalId: facility._id, ...EMPTY_DASHBOARD } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: "Hospital approved.", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Approval failed." });
  }
};

export const rejectHospital = async (req, res) => {
  try {
    const { reason } = req.body;
    const facility = await Hospital.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", isApproved: false, rejectionReason: reason || null },
      { new: true }
    );
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    res.status(200).json({ success: true, message: "Hospital rejected.", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Rejection failed." });
  }
};

export const deleteHospital = async (req, res) => {
  try {
    const facility = await Hospital.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: "Hospital not found." });

    // Delete all Cloudinary assets
    const publicIds = [
      facility.profilePhotoPublicId,
      facility.registrationCertPublicId,
      facility.licenseCertPublicId,
      facility.ownerIdDocPublicId,
      facility.buildingPermitPublicId,
    ].filter(Boolean);

    await Promise.allSettled(publicIds.map(id => deleteFromCloudinary(id, "image")));

    // Delete dashboard data
    await HospitalDashboard.findOneAndDelete({ hospitalId: req.params.id });

    // Delete hospital account
    await Hospital.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Hospital and all data deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};