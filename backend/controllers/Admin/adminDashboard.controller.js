import Doctor from "../../models/doctors/Doctor.js";
import Consultation from "../../models/doctors/Consultation.js";

export const adminDashboardStats = async (req, res) => {
  try {
    // Doctors
    const totalDoctors = await Doctor.countDocuments();
    const pendingDoctors = await Doctor.countDocuments({ isVerified: false });
    const approvedDoctors = await Doctor.countDocuments({ isVerified: true });
    const blockedDoctors = await Doctor.countDocuments({ isActive: false });

    // Consultations
    const totalConsultations = await Consultation.countDocuments();
    const pendingConsultations = await Consultation.countDocuments({
      status: "pending",
    });

    const earningsAgg = await Doctor.aggregate([
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$wallet.totalEarnings" },
        },
      },
    ]);

    const totalEarnings =
      earningsAgg.length > 0 ? earningsAgg[0].totalEarnings : 0;

    res.json({
      success: true,
      data: {
        totalDoctors,
        pendingDoctors,
        approvedDoctors,
        blockedDoctors,
        totalConsultations,
        pendingConsultations,
        totalEarnings,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Failed to load admin dashboard" });
  }
};
