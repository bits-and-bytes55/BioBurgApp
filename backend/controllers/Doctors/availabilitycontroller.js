import Doctor from "../../models/doctors/Doctor.js";

export const getAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id).select("availability");

    res.json({
      success: true,
      availability: doctor?.availability || { days: [], slots: [] }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch availability" });
  }
};

export const saveAvailability = async (req, res) => {
  try {
    const { days, slots } = req.body;

    await Doctor.findByIdAndUpdate(req.doctor.id, {
      availability: { days, slots }
    });

    res.json({
      success: true,
      message: "Availability saved successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save availability" });
  }
};
