import Partner from "../../models/radiology/Partner.model.js";
import Booking from "../../models/radiology/Booking.model.js";
import PartnerUser from "../../models/radiology/PartnerUser.model.js";
import RadiologyReport from "../../models/radiology/Report.model.js";
import generatePassword from "../../utils/generatePassword.js";


/**
 * GET ALL RADIOLOGY PARTNERS (ADMIN)
 */
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: partners,
    });
  } catch (error) {
    console.error("GET ALL PARTNERS ERROR 👉", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch partners",
    });
  }
};

/**
 * GET ALL PENDING PARTNERS
 */
export const getPendingPartners = async (req, res) => {
  const partners = await Partner.find({ status: "PENDING" })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: partners });
};

/**
 * APPROVE PARTNER
 */
export const approvePartner = async (req, res) => {
  const { partnerId } = req.body;

  const partner = await Partner.findById(partnerId);
  if (!partner) {
    return res.status(404).json({ success: false });
  }

  partner.status = "APPROVED";
  await partner.save();

  // Create Partner Login
  const password = generatePassword();

  await PartnerUser.create({
    partnerId: partner._id,
    email: partner.email,
    password,
  });

  res.json({
    success: true,
    message: "Partner approved & login created",
    credentials: {
      email: partner.email,
      password,
    }
  });
};

/**
 * REJECT PARTNER
 */
export const rejectPartner = async (req, res) => {
  const { partnerId, reason } = req.body;

  const partner = await Partner.findById(partnerId);
  if (!partner) {
    return res.status(404).json({ success: false });
  }

  partner.status = "REJECTED";
  partner.rejectionReason = reason;
  await partner.save();

  res.json({
    success: true,
    message: "Partner rejected",
  });
};

export const getAllRadiologyCenters = async (req, res) => {
  try {
    const centers = await Partner.find({
      businessType: { 
        $in: ["Radiology Centre", "Diagnostic Centre (Both)"] 
      }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: centers,
    });
  } catch (error) {
    console.error("GET RADIOLOGY CENTERS ERROR 👉", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch radiology centers",
    });
  }
};


export const getPendingRadiologyCenters = async (req, res) => {
  try {
    const centers = await Partner.find({
      businessType: { 
        $in: ["Radiology Centre", "Diagnostic Centre (Both)"] 
      },
      status: "PENDING",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: centers,
    });
  } catch (error) {
    console.error("GET PENDING RADIOLOGY CENTERS ERROR 👉", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending radiology centers",
    });
  }
};


/**
 * GET ALL RADIOLOGY BOOKINGS (ADMIN)
 */
export const getAllRadiologyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("partnerId", "businessName city businessType")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("ADMIN BOOKING ERROR 👉", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};



/**
 * GET ALL RADIOLOGY REPORTS (ADMIN)
 */
export const getAllRadiologyReports = async (req, res) => {
  try {
    const reports = await RadiologyReport.find()
      .populate({
        path: "bookingId",
        select: "patientName patientMobile testName bookingDate",
      })
      .populate({
        path: "partnerId",
        select: "businessName city",
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("ADMIN REPORT ERROR 👉", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};



