import Pharmacy from "../models/Pharmacy.js";
import PharmacyDashboard from "../models/pharmacyDashboard.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
// import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
//  In-memory OTP store 
const otpStore = new Map();

//  Email transporter 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Safe email helper (never crashes the main flow) 
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"BioBurg Pharmacy" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(` Email sent → ${to} | ${subject}`);
  } catch (err) {
    console.error(`Email failed → ${to}:`, err.message);
  }
}

//  Extract device / browser / IP from request 
function getLoginMeta(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "Unknown";

  const ua = req.headers["user-agent"] || "";
  const time = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "medium",
  });

  let device = "Desktop";
  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet|ipad/i.test(ua)) device = "Tablet";

  let browser = "Unknown";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edg/i.test(ua)) browser = "Edge";

  return { ip, time, device, browser };
}

//  Login alert email template 
function buildLoginAlertHTML({ facilityName, email, contactPerson, time, ip, device, browser }) {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(135deg,#059669,#0d9488);padding:28px 32px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px"></div>
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800">New Login Detected</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">BioBurg Pharmacy Portal</p>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#334155;font-size:14px;margin-bottom:20px;line-height:1.6">
        Hello <strong>${contactPerson || facilityName}</strong>,<br/>
        A new login was detected on your pharmacy account. If this was you, no action is needed.
      </p>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;width:38%">Pharmacy</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-weight:600">${facilityName}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase">Account</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${email}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase">Date &amp; Time</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${time}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase">IP Address</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-family:monospace">${ip}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase">Device</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a">${device}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase">Browser</td><td style="padding:8px 0;color:#0f172a">${browser}</td></tr>
        </table>
      </div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin-bottom:20px">
        <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.5">
           <strong>Not you?</strong> Change your password immediately and contact
          <a href="mailto:support@bioburg.in" style="color:#059669">support@bioburg.in</a>
        </p>
      </div>
      <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">Automated security alert · BioBurg Pharmacy System</p>
    </div>
  </div>`;
}

export const registerPharmacy = async (req, res) => {
  try {
    const { email, registrationNumber, password, ...otherFields } = req.body;
    const existing = await Pharmacy.findOne({ $or: [{ email }, { registrationNumber }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy with this email or registration number already exists",
      });
    }
    const facility = await Pharmacy.create({
      ...otherFields,
      email,
      registrationNumber,
      password,
      facilityType: "pharmacy",
      status: "pending",
      isApproved: false,
    });

    sendEmail(
      email,
      "Registration Received – BioBurg Pharmacy",
      `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff">
        <h2 style="color:#059669">Registration Received!</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6">Dear <strong>${otherFields.contactPerson || "Admin"}</strong>,<br/><br/>
        Your pharmacy <strong>${otherFields.facilityName}</strong> is registered and pending admin approval (24–48 hrs).</p>
        <p style="font-size:12px;color:#94a3b8;text-align:center">BioBurg Pharmacy · support@bioburg.in</p>
      </div>`
    ).catch(console.error);

    res.status(201).json({
      success: true,
      message: "Pharmacy registered successfully! Awaiting admin approval.",
      facility: {
        id: facility._id,
        facilityName: facility.facilityName,
        facilityType: facility.facilityType,
        email: facility.email,
        status: facility.status,
        isApproved: facility.isApproved,
      },
    });
  } catch (error) {
    console.error("Pharmacy registration error:", error);
    res.status(500).json({ success: false, message: error.message || "Registration failed" });
  }
};

export const loginPharmacy = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Please provide email and password" });

    const facility = await Pharmacy.findOne({ email }).select("+password");
    if (!facility)
      return res.status(404).json({ success: false, message: "Invalid email or password" });

    if (facility.status === "pending")
      return res.status(403).json({ success: false, message: "Your account is pending admin approval. Please wait.", status: "pending" });
    if (facility.status === "rejected")
      return res.status(403).json({ success: false, message: "Your registration has been rejected. Please contact support.", status: "rejected" });
    if (!facility.isActive)
      return res.status(403).json({ success: false, message: "Your account has been deactivated. Please contact support." });

    const isPasswordMatch = await facility.matchPassword(password);
    if (!isPasswordMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // Collect metadata
    const meta = getLoginMeta(req);

    // Save login history (non-blocking)
    Pharmacy.findByIdAndUpdate(
      facility._id,
      {
        $push: {
          loginHistory: {
            $each: [{ ip: meta.ip, device: meta.device, browser: meta.browser, time: new Date() }],
            $slice: -50,
          },
        },
        lastLoginAt: new Date(),
        lastLoginIp: meta.ip,
      },
      { new: false }
    ).catch((e) => console.error("Login history error:", e.message));

    // Send alert to pharmacy email (fire & forget)
    sendEmail(
      facility.email,
      `New Login Alert – ${facility.facilityName}`,
      buildLoginAlertHTML({
        facilityName: facility.facilityName,
        email: facility.email,
        contactPerson: facility.contactPerson,
        time: meta.time,
        ip: meta.ip,
        device: meta.device,
        browser: meta.browser,
      })
    ).catch(console.error);

    // Also alert admin (if ADMIN_EMAIL is set in .env)
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== facility.email) {
      sendEmail(
        process.env.ADMIN_EMAIL,
        `🔔 Pharmacy Login: ${facility.facilityName} (${facility.email})`,
        buildLoginAlertHTML({
          facilityName: facility.facilityName,
          email: facility.email,
          contactPerson: facility.contactPerson,
          time: meta.time,
          ip: meta.ip,
          device: meta.device,
          browser: meta.browser,
        })
      ).catch(console.error);
    }

    const token = jwt.sign(
      { id: facility._id, type: "pharmacy" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return full profile so frontend localStorage has everything
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      facility: {
        id: facility._id,
        _id: facility._id,
        facilityName: facility.facilityName,
        facilityType: facility.facilityType,
        email: facility.email,
        phone: facility.phone,
        alternatePhone: facility.alternatePhone,
        whatsappNumber: facility.whatsappNumber,
        contactPerson: facility.contactPerson,
        designation: facility.designation,
        address: facility.address,
        city: facility.city,
        state: facility.state,
        pinCode: facility.pinCode,
        gstNumber: facility.gstNumber,
        panNumber: facility.panNumber,
        drugLicenseNumber: facility.drugLicenseNumber,
        licenseNumber: facility.licenseNumber,
        registrationNumber: facility.registrationNumber,
        pharmacy24x7: facility.pharmacy24x7,
        homeDelivery: facility.homeDelivery,
        onlinePrescription: facility.onlinePrescription,
        genericMedicines: facility.genericMedicines,
        profilePhoto: facility.profilePhoto || null,
        isApproved: facility.isApproved,
        status: facility.status,
      },
    });
  } catch (error) {
    console.error("Pharmacy login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const forgotPharmacyPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const facility = await Pharmacy.findOne({ email });
    if (!facility)
      return res.status(404).json({ success: false, message: "No pharmacy registered with this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt });

    await sendEmail(
      email,
      "Password Reset OTP – BioBurg Pharmacy",
      `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:48px"></div>
          <h2 style="color:#059669;margin:8px 0">Password Reset OTP</h2>
          <p style="color:#64748b;font-size:13px">${facility.facilityName}</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <div style="display:inline-block;background:#f0fdf4;border:2px dashed #059669;border-radius:12px;padding:16px 40px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#059669">${otp}</span>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center">Valid for <strong>10 minutes</strong>. Do not share with anyone.</p>
        <p style="color:#cbd5e1;font-size:11px;text-align:center">If you didn't request this, please ignore this email.</p>
      </div>`
    );

    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP. Check email configuration." });
  }
};

export const resetPharmacyPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });

    const stored = otpStore.get(email);
    if (!stored)
      return res.status(400).json({ success: false, message: "OTP not found. Please request a new one." });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }
    if (stored.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    const facility = await Pharmacy.findOne({ email }).select("+password");
    if (!facility)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });

    facility.password = newPassword;
    await facility.save();
    otpStore.delete(email);

    sendEmail(
      email,
      "Password Changed – BioBurg Pharmacy",
      `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#059669">Password Changed</h2>
        <p style="color:#334155;font-size:14px">Your password for <strong>${facility.facilityName}</strong> was changed at <strong>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong>.</p>
        <p style="color:#94a3b8;font-size:12px">If you did not do this, contact support@bioburg.in immediately.</p>
      </div>`
    ).catch(console.error);

    res.status(200).json({ success: true, message: "Password reset successfully. Please login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

export const getAllPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: pharmacies.length, pharmacies });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch pharmacies" });
  }
};

export const approvePharmacy = async (req, res) => {
  try {
    const facility = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { status: "approved", isApproved: true, approvedAt: new Date() },
      { new: true }
    );
    if (!facility)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });

    sendEmail(
      facility.email,
      "Your Pharmacy Account is Approved – BioBurg",
      `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#fff">
        <div style="text-align:center;margin-bottom:24px"><div style="font-size:48px">🎉</div><h2 style="color:#059669">Account Approved!</h2></div>
        <p style="color:#334155;font-size:14px;line-height:1.6">Congratulations <strong>${facility.contactPerson || facility.facilityName}</strong>!<br/><br/>
        Your pharmacy <strong>${facility.facilityName}</strong> is now approved. You can login and start managing your pharmacy.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.FRONTEND_URL || "https://bioburg.in"}/pharmacy/login" style="display:inline-block;background:#059669;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Login to Dashboard →</a>
        </div>
        <p style="font-size:12px;color:#94a3b8;text-align:center">BioBurg Pharmacy System · support@bioburg.in</p>
      </div>`
    ).catch(console.error);

    res.status(200).json({ success: true, message: "Pharmacy approved successfully", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Approval failed" });
  }
};

export const rejectPharmacy = async (req, res) => {
  try {
    const { reason } = req.body;
    const facility = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", isApproved: false, rejectionReason: reason || null },
      { new: true }
    );
    if (!facility)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });

    sendEmail(
      facility.email,
      "Pharmacy Registration Update – BioBurg",
      `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#be123c">Registration Update</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6">Dear ${facility.contactPerson || "Applicant"},<br/><br/>
        Your pharmacy registration for <strong>${facility.facilityName}</strong> has not been approved.</p>
        ${reason ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;padding:14px;margin:14px 0"><p style="margin:0;font-size:13px;color:#9f1239"><strong>Reason:</strong> ${reason}</p></div>` : ""}
        <p style="font-size:13px;color:#64748b">Please contact support@bioburg.in for further information.</p>
      </div>`
    ).catch(console.error);

    res.status(200).json({ success: true, message: "Pharmacy rejected", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Rejection failed" });
  }
};

export const getPharmacyProfile = async (req, res) => {
  try {
    const facility = await Pharmacy.findById(req.user.id);
    if (!facility)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });
    res.status(200).json({ success: true, facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};


// ── Cloudinary helper — deletes image by public_id extracted from URL ─────────
async function deleteFromCloudinary(url) {
  if (!url || !url.includes("cloudinary.com")) return; // only Cloudinary URLs
  try {
    const { v2: cloudinary } = await import("cloudinary");
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (!match) return;
    const publicId = match[1];
    await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary deleted: ${publicId}`);
  } catch (err) {
    console.warn("Cloudinary delete failed:", err.message);
  }
}

export const updatePharmacyProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.email;
    delete updates.registrationNumber;

    // If logoUrl is being cleared/changed, delete the old one from Cloudinary
    if ("logoUrl" in updates) {
      const existing = await Pharmacy.findById(req.user.id).select("logoUrl");
      if (existing?.logoUrl && existing.logoUrl !== updates.logoUrl) {
        deleteFromCloudinary(existing.logoUrl).catch(console.warn);
      }
    }

    const facility = await Pharmacy.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!facility)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });
    res.status(200).json({ success: true, message: "Profile updated", facility });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const updatePharmacyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Please provide current and new password" });

    const facility = await Pharmacy.findById(req.user.id).select("+password");
    if (!facility)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });

    const isMatch = await facility.matchPassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Current password is incorrect" });

    facility.password = newPassword;
    await facility.save();

    sendEmail(
      facility.email,
      "Password Changed – BioBurg Pharmacy",
      `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#059669">Password Updated</h2>
        <p style="color:#334155;font-size:14px">Your dashboard password for <strong>${facility.facilityName}</strong> was updated at <strong>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong>.</p>
        <p style="color:#94a3b8;font-size:12px">If you did not change your password, contact support@bioburg.in immediately.</p>
      </div>`
    ).catch(console.error);

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update password" });
  }
};

export const getLoginHistory = async (req, res) => {
  try {
    const facility = await Pharmacy.findById(req.user.id).select(
      "loginHistory lastLoginAt lastLoginIp"
    );
    if (!facility)
      return res.status(404).json({ success: false, message: "Pharmacy not found" });

    res.status(200).json({
      success: true,
      loginHistory: (facility.loginHistory || []).slice().reverse(),
      lastLoginAt: facility.lastLoginAt,
      lastLoginIp: facility.lastLoginIp,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch login history" });
  }
};

export const getMyPharmacyDashboard = async (req, res) => {
  try {
    const pharmacyId = req.user.id;
    let dashboard = await PharmacyDashboard.findOne({ pharmacyId });
    if (!dashboard) {
      dashboard = await PharmacyDashboard.create({ pharmacyId });
    }
    res.status(200).json({ success: true, dashboard, data: dashboard });
  } catch (error) {
    console.error("Pharmacy dashboard fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard" });
  }
};

export const updatePharmacyDashboardSection = async (req, res) => {
  try {
    const pharmacyId = req.user.id;
    const { section, data } = req.body;

    if (!section)
      return res.status(400).json({ success: false, message: "Section is required" });

    const ALLOWED_SECTIONS = [
      "prescriptions", "orders", "inventory", "expiring",
      "billing", "staff", "suppliers", "returns",
      "medicines", "expiry", "purchases", "customers",
    ];

    if (!ALLOWED_SECTIONS.includes(section))
      return res.status(400).json({ success: false, message: `Invalid section: "${section}"` });

    const dashboard = await PharmacyDashboard.findOneAndUpdate(
      { pharmacyId },
      {
        $set: {
          [section]: data,
          [`${section}UpdatedAt`]: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, dashboard });
  } catch (error) {
    console.error("Dashboard update error:", error);
    res.status(500).json({ success: false, message: "Failed to update dashboard" });
  }
};

export const getPharmacyDashboard = async (req, res) => {
  try {
    const pharmacyId = req.params.id;
    const dashboard = await PharmacyDashboard.findOne({ pharmacyId });

    if (!dashboard) {
      return res.status(200).json({
        success: true,
        dashboard: {
          prescriptions: [], orders: [], inventory: [],
          expiring: [], billing: [], staff: [],
          suppliers: [], returns: [], customers: [], purchases: [],
        },
      });
    }

    res.status(200).json({ success: true, dashboard });
  } catch (error) {
    console.error("Admin pharmacy dashboard fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
};