import DoctorConsultation from "../../models/doctors/Consultationmodel.js";

/* ===== GET ALL CONSULTATIONS FOR DOCTOR ===== */
export const getConsultations = async (req, res) => {
  try {
    const consultations = await DoctorConsultation.find({
      doctor: req.doctor._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: consultations
    });

  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
/* ===== UPDATE CONSULTATION STATUS ===== */
export const updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await DoctorConsultation.findOneAndUpdate(
      { _id: id, doctor: req.doctor._id },   //  secure
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== CREATE CONSULTATION (for users / admin seeding) ===== */
export const createConsultation = async (req, res) => {
  try {
    const { doctorId, name, phone, consultType, slot } = req.body;

    if (!doctorId || !name || !phone || !slot) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const consultation = await DoctorConsultation.create({
      doctor: doctorId,
      patientName: name,
      patientMobile: phone,
      date: new Date(),
      time: slot,
      mode:
        consultType === "video"
          ? "Video"
          : consultType === "chat"
          ? "Chat"
          : "Audio",
    });

    res.status(201).json({
      success: true,
      data: consultation
    });

  } catch (err) {
    console.error("CREATE CONSULT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};