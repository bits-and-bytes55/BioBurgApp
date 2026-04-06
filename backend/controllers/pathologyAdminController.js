// controllers/admin/pathologyAdminController.js
import Lab from "../models/pathology/Lab.js";

export const getAllLabs = async (req, res) => {
  try {
    const labs = await Lab.find()
      .select("-password") // 🔒 never expose password
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: labs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const updateLabStatus = async (req, res) => {
  try {
    const { status } = req.body; // ACTIVE / INACTIVE

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    res.json({
      success: true,
      message: `Lab marked as ${status}`,
      data: lab,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
