// controllers/Doctors/consultationController.js
import DoctorConsultation from "../../models/doctors/Consultationmodel.js";

/* ===== BOOK CONSULTATION (patient-facing) ===== */
export const bookConsultation = async (req, res) => {
  try {
    const {
      doctorId,
      // frontend sends these field names:
      name,         patientName,
      phone,        patientMobile,
      consultType,
      slot,         time,
      symptoms,
      age,
      gender,
      email,
    } = req.body;

    const resolvedName   = patientName   || name;
    const resolvedMobile = patientMobile || phone;
    const resolvedTime   = time          || slot;

    if (!doctorId || !resolvedName || !resolvedMobile || !resolvedTime) {
      return res.status(400).json({ message: "Missing required fields: doctorId, name, phone, slot" });
    }

    const modeMap = { video: "Video", chat: "Chat", phone: "Audio", audio: "Audio" };
    const resolvedMode = modeMap[consultType?.toLowerCase()] || "Video";

    const consultation = await DoctorConsultation.create({
      doctor:        doctorId,
      patientName:   resolvedName,
      patientMobile: resolvedMobile,
      date:          new Date().toISOString().split("T")[0],
      time:          resolvedTime,
      mode:          resolvedMode,
      symptoms,
      age,
      gender,
      email,
      status:        "pending",
    });

    res.status(201).json({ success: true, consultation });
  } catch (err) {
    console.error("BOOK ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== GET CONSULTATIONS FOR LOGGED-IN DOCTOR ===== */
export const getConsultations = async (req, res) => {
  try {
    const consultations = await DoctorConsultation.find({
      doctor: req.doctor._id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: consultations });
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== UPDATE CONSULTATION STATUS (doctor) ===== */
export const updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await DoctorConsultation.findOneAndUpdate(
      { _id: id, doctor: req.doctor._id },
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Consultation not found" });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};