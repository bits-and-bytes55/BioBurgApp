// controllers/adminConsultation.controller.js
import DoctorConsultation from "../../../models/doctors/Consultationmodel.js";

/* ===== GET ALL CONSULTATIONS (Admin view) ===== */
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

/* ===== CLOSE CONSULTATION (mark as completed) ===== */
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

/* ===== REOPEN CONSULTATION ===== */
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

/* ===== GET PENDING CONSULTATIONS ===== */
export const getPendingConsultations = async (req, res) => {
  try {
    const consultations = await DoctorConsultation.find({ status: "pending" })
      .populate("doctor", "fullName email specialization");

    res.json({ success: true, data: consultations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== UPDATE STATUS ===== */
export const updateConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const consultation = await DoctorConsultation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!consultation)
      return res.status(404).json({ message: "Consultation not found" });
    res.json({ success: true, data: consultation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};