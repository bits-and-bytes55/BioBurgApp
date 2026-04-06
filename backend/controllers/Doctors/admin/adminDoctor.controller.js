// controllers/adminDoctor.controller.js
import Doctor from "../../../models/doctors/Doctor.js";
import DoctorConsultation from "../../../models/doctors/Consultationmodel.js";

/* ===== ADMIN DASHBOARD ===== */
export const getAdminDashboard = async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments();
    const pendingDoctors = await Doctor.countDocuments({ status: "pending" });
    const approvedDoctors = await Doctor.countDocuments({ status: "approved", isActive: true });
    const blockedDoctors = await Doctor.countDocuments({ status: "approved", isActive: false });
    const totalConsultations = await DoctorConsultation.countDocuments();
    const pendingConsultations = await DoctorConsultation.countDocuments({ status: "pending" });
    const completedConsultations = await DoctorConsultation.countDocuments({ status: "completed" });

    const earningsData = await Doctor.aggregate([
      { $group: { _id: null, total: { $sum: "$wallet.totalEarnings" } } },
    ]);
    const totalEarnings = earningsData[0]?.total || 0;

    // Recent doctors
    const recentDoctors = await Doctor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName specialization status isActive createdAt");

    res.json({
      success: true,
      data: {
        totalDoctors,
        pendingDoctors,
        approvedDoctors,
        blockedDoctors,
        totalConsultations,
        pendingConsultations,
        completedConsultations,
        totalEarnings,
        recentDoctors,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

/* ===== ALL DOCTORS ===== */
export const getAllDoctors = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status === "active") query = { status: "approved", isActive: true };
    else if (status === "pending") query = { status: "pending" };
    else if (status === "blocked") query = { status: "approved", isActive: false };
    else if (status === "rejected") query = { status: "rejected" };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    const doctors = await Doctor.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error("Get all doctors error:", error);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};

/* ===== PENDING DOCTORS ===== */
export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending doctors" });
  }
};

/* ===== GET SINGLE DOCTOR ===== */
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
};

/* ===== APPROVE DOCTOR ===== */
export const approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status: "approved", isActive: true },
      { new: true }
    ).select("-password");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({
      success: true,
      message: "Doctor approved successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Approve doctor error:", error);
    res.status(500).json({ message: "Failed to approve doctor" });
  }
};

/* ===== REJECT DOCTOR ===== */
export const rejectDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", isActive: false },
      { new: true }
    ).select("-password");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({
      success: true,
      message: "Doctor rejected",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject doctor" });
  }
};

/* ===== BLOCK / UNBLOCK ===== */
export const toggleBlockDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.status !== "approved") {
      return res.status(400).json({
        message: "Only approved doctors can be blocked/unblocked",
      });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    res.json({
      success: true,
      message: doctor.isActive ? "Doctor unblocked successfully" : "Doctor blocked successfully",
      data: { id: doctor._id, isActive: doctor.isActive },
    });
  } catch (error) {
    console.error("Toggle block error:", error);
    res.status(500).json({ message: "Failed to update doctor status" });
  }
};

/* ===== ALL CONSULTATIONS (Admin view) ===== */
export const getAllConsultations = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== "all" ? { status } : {};
 
    const consultations = await DoctorConsultation.find(query)
      .populate("doctor", "fullName email specialization")
      .sort({ createdAt: -1 });
 
    res.json({ success: true, data: consultations });
  } catch (error) {
    console.error("Get all consultations error:", error);
    res.status(500).json({ message: "Failed to fetch consultations" });
  }
};

/* ===== CLOSE CONSULTATION (Admin) ===== */
export const closeConsultation = async (req, res) => {
  try {
    const consultation = await DoctorConsultation.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );
    if (!consultation)
      return res.status(404).json({ message: "Consultation not found" });
    res.json({ success: true, message: "Consultation closed", data: consultation });
  } catch (error) {
    res.status(500).json({ message: "Failed to close consultation" });
  }
};

/* ===== REOPEN CONSULTATION (Admin) ===== */
export const openConsultation = async (req, res) => {
  try {
    const consultation = await DoctorConsultation.findByIdAndUpdate(
      req.params.id,
      { status: "pending" },
      { new: true }
    );
    if (!consultation)
      return res.status(404).json({ message: "Consultation not found" });
    res.json({ success: true, message: "Consultation reopened", data: consultation });
  } catch (error) {
    res.status(500).json({ message: "Failed to reopen consultation" });
  }
};