import Doctor from "../../models/doctors/Doctor.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//  helpers
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Upload base64 image to Cloudinary
const uploadToCloudinary = async (base64String, publicId) => {
  const result = await cloudinary.uploader.upload(base64String, {
    public_id:    publicId,
    folder:       "bioburg/doctors",
    overwrite:    true,
    resource_type: "image",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId); } catch (e) { /* silent */ }
};

//  REGISTER
export const registerDoctor = async (req, res) => {
  try {
    const { email, photo: base64Photo, ...rest } = req.body;
    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    let photoData = {};
    if (base64Photo && base64Photo.startsWith("data:image")) {
      const uploaded = await uploadToCloudinary(
        base64Photo,
        `doctor_reg_${Date.now()}`
      );
      photoData = { photo: uploaded.url, photoPublicId: uploaded.publicId };
    }

    const doctor = await Doctor.create({ email, ...rest, ...photoData, status: "pending" });
    res.status(201).json({ message: "Registration submitted for approval", id: doctor._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  LOGIN
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email }).select("+password");
    if (!doctor) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await doctor.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    if (doctor.status === "pending")
      return res.status(403).json({ message: "Account pending admin approval" });
    if (doctor.status === "blocked")
      return res.status(403).json({ message: "Account has been blocked" });

    const token = signToken(doctor._id);
    res.json({
      token,
      doctor: {
        id: doctor._id,
        name: doctor.fullName,
        email: doctor.email,
        specialization: doctor.specialization,
        photo: doctor.photo,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

//  GET PROFILE 
export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id).select("-password");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

//  UPDATE PROFILE (with optional base64 photo) 
export const updateDoctorProfile = async (req, res) => {
  try {
    const { photo: base64Photo, ...rest } = req.body;
    // Never allow these to be changed via profile update
    delete rest.password;
    delete rest.status;
    delete rest.email;

    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) return res.status(404).json({ message: "Not found" });

    let photoUpdate = {};
    if (base64Photo && base64Photo.startsWith("data:image")) {
      // Delete old Cloudinary image if exists
      if (doctor.photoPublicId) await deleteFromCloudinary(doctor.photoPublicId);

      const uploaded = await uploadToCloudinary(
        base64Photo,
        `doctor_${doctor._id}`
      );
      photoUpdate = { photo: uploaded.url, photoPublicId: uploaded.publicId };
    }

    const updated = await Doctor.findByIdAndUpdate(
      req.doctor._id,
      { ...rest, ...photoUpdate },
      { new: true }
    ).select("-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed: " + err.message });
  }
};

//  UPLOAD PHOTO ONLY (standalone endpoint) 
export const uploadDoctorPhoto = async (req, res) => {
  try {
    const { photo: base64Photo } = req.body;
    if (!base64Photo || !base64Photo.startsWith("data:image"))
      return res.status(400).json({ message: "Valid base64 image required" });

    const doctor = await Doctor.findById(req.doctor._id);
    // Delete old photo from Cloudinary
    if (doctor.photoPublicId) await deleteFromCloudinary(doctor.photoPublicId);

    const uploaded = await uploadToCloudinary(base64Photo, `doctor_${doctor._id}`);
    await Doctor.findByIdAndUpdate(req.doctor._id, {
      photo: uploaded.url,
      photoPublicId: uploaded.publicId,
    });

    res.json({ photo: uploaded.url, message: "Photo updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Photo upload failed: " + err.message });
  }
};

//  DELETE PHOTO 
export const deleteDoctorPhoto = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id);
    if (doctor.photoPublicId) await deleteFromCloudinary(doctor.photoPublicId);
    await Doctor.findByIdAndUpdate(req.doctor._id, { photo: "", photoPublicId: "" });
    res.json({ message: "Photo deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

//  DASHBOARD STATS 
export const doctorDashboardStats = async (req, res) => {
  try {
    const docId = req.doctor._id;

    const { default: Consultation } = await import("../../models/Doctors/Consultation.js");
    const { default: DoctorWallet } = await import("../../models/Doctors/DoctorWallet.js");

    const totalConsultations = await Consultation.countDocuments({ doctor: docId });

    const today = new Date();
    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayAppointments = await Consultation.countDocuments({
      doctor: docId,
      date: { $gte: today, $lt: tomorrow }
    });

    const pendingConsultations = await Consultation.countDocuments({
      doctor: docId,
      status: "pending"
    });

    const wallet = await DoctorWallet.findOne({ doctor: docId });

    res.json({
      totalConsultations,
      todayAppointments,
      pendingConsultations,
      totalEarnings: wallet?.totalEarnings || 0
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── APPROVED DOCTORS (public — for user booking page) 
export const getApprovedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" })
      .select("fullName email specialization qualification experience consultationFee rating reviews languages available nextSlot about photo gender regNumber consultationModes")
      .sort({ available: -1, rating: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};

// ─── TOGGLE AVAILABILITY 
export const toggleAvailability = async (req, res) => {
  try {
    const { available } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.doctor._id,
      { available },
      { new: true }
    ).select("available");
    res.json({ available: doctor.available });
  } catch (err) {
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ─── ADMIN: DELETE DOCTOR (also deletes Cloudinary photo) 
export const adminDeleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    // Delete photo from Cloudinary
    if (doctor.photoPublicId) await deleteFromCloudinary(doctor.photoPublicId);
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor deleted and photo removed from Cloudinary" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

export const getDoctorActivity = async (req, res) => {
  try {
    const docId = req.doctor._id;

    const { default: Consultation } = await import("../../models/Doctors/Consultation.js");

    const consultations = await Consultation.find({ doctor: docId })
      .sort({ createdAt: -1 })
      .limit(5);

    const activity = consultations.map(c => ({
      text: `Consultation ${c.status} with ${c.patientName || "Patient"}`,
      time: new Date(c.createdAt).toLocaleString("en-IN"),
      type: "consultation"
    }));

    res.json(activity);

  } catch (err) {
    console.error("ACTIVITY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};