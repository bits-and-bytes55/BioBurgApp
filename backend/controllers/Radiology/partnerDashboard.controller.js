import Partner from "../../models/radiology/Partner.model.js";
import Booking from "../../models/radiology/Booking.model.js";
import Report from "../../models/radiology/Report.model.js";
import mongoose from "mongoose";
import cloudinary from "../../config/cloudinary.js";
import User from "../../models/User.js";
/**
 * MY PROFILE
 */
export const getMyProfile = async (req, res) => {
  const partner = await Partner.findById(req.user.partnerId)
    .select("-__v");

  res.json({
    success: true,
    data: partner,
  });
};

/**
 * MY BOOKINGS
 */
export const getPartnerBookings = async (req, res) => {
  try {
    const partnerId = req.user.partnerId; // JWT se

    const bookings = await Booking.find({ partnerId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};


/**
 * MY REPORTS
 */
export const getMyReports = async (req, res) => {
  const reports = await Report.find({
    partnerId: req.user.partnerId,
  }).populate("bookingId");

  res.json({
    success: true,
    data: reports,
  });
};

export const uploadReport = async (req, res) => {
  try {
    const { bookingId, fileBase64 } = req.body;
    const partnerId = req.user.partnerId;

    if (!bookingId || !fileBase64) {
      return res.status(400).json({
        success: false,
        message: "Booking ID & report file required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const isPdf = fileBase64.startsWith("data:application/pdf");
    const isImage = fileBase64.startsWith("data:image/");
    const resourceType = isPdf ? "raw" : isImage ? "image" : "raw";

    const uploadRes = await cloudinary.uploader.upload(fileBase64, {
      folder: "reports",
      resource_type: resourceType,
    });

    let finalUrl = uploadRes.secure_url;
    if (isPdf && finalUrl.includes("/image/upload/")) {
      finalUrl = finalUrl.replace("/image/upload/", "/raw/upload/");
    }

    const report = await Report.create({
      partnerId,
      bookingId,
      userId: booking.userId || null,
      reportFile: {
        url: finalUrl,
        public_id: uploadRes.public_id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: report,
    });
  } catch (error) {
    console.error("REPORT UPLOAD ERROR", error);
    res.status(500).json({
      success: false,
      message: "Report upload failed",
    });
  }
};
 // add this import at top

export const createBooking = async (req, res) => {
  try {
    const {
      patientName,
      patientMobile,
      testName,
      bookingDate,
      userEmail,
    } = req.body;

    const partnerId = req.user.partnerId;

    if (!patientName || !testName || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    let userId = null;
    if (userEmail) {
      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (user) userId = user._id;
    }

    const booking = await Booking.create({
      patientName,
      patientMobile,
      testName,
      bookingDate: new Date(bookingDate),
      partnerId: new mongoose.Types.ObjectId(partnerId),
      userId, // ✅ null for walk-in, linked if email matched
      status: "BOOKED",
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
      userLinked: !!userId,
    });
  } catch (error) {
    console.error("BOOKING CREATE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { mobile, address, city, state, servicesOffered, homeCollection, notes } = req.body;
    const partnerId = req.user.partnerId;

    const updated = await Partner.findByIdAndUpdate(
      partnerId,
      { $set: { mobile, address, city, state, servicesOffered, homeCollection, notes } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const partnerId = req.user.partnerId;

    //  Ensure partner can only update their own booking
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, partnerId },
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or unauthorized",
      });
    }

    res.json({
      success: true,
      data: booking,
    });

  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};