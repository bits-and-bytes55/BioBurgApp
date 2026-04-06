import Report from "../../models/pathology/Report.js";
import Booking from "../../models/pathology/Booking.js";
import cloudinary from "../../config/cloudinary.js";

export const uploadReport = async (req, res) => {
  try {
    const { bookingId, fileBase64 } = req.body;

    if (!bookingId || !fileBase64) {
      return res.status(400).json({ message: "All fields required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      labId: req.lab._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const uploadRes = await cloudinary.uploader.upload(fileBase64, {
      folder: "lab-reports",
      resource_type: "auto",
    });

    const report = await Report.create({
      labId: req.lab._id,
      bookingId,
      reportUrl: uploadRes.secure_url,
      reportPublicId: uploadRes.public_id,
    });

    booking.status = "REPORT_READY";
    await booking.save();

    res.status(201).json({
      success: true,
      message: "Report uploaded",
      data: report,
    });
  } catch (err) {
    console.error("REPORT UPLOAD ERROR", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      labId: req.lab._id,
    }).populate("bookingId");

    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
