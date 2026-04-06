import LabTest from "../models/LabTest.js";

// -----------------------
// CREATE LAB TEST BOOKING
// -----------------------
export const createLabTestBooking = async (req, res) => {
  try {
    // Extract normal JSON fields
    const {
      fullName,
      gender,
      age,
      phone,
      altPhone,
      email,
      address,
      city,
      state,
      pincode,
      selectedTests,
      collectionType,
      preferredDate,
      timeSlot,
      medicalCondition,
      paymentMethod,
      totalAmount
    } = req.body;

    // Handle uploaded files (Optional)
    let prescription = null;
    let previousReports = null;

    if (req.files?.prescription) {
      prescription = req.files.prescription[0].filename;
    }

    if (req.files?.previousReports) {
      previousReports = req.files.previousReports[0].filename;
    }

    // Create new booking in database
    const booking = await LabTest.create({
      fullName,
      gender,
      age,
      phone,
      altPhone,
      email,
      address,
      city,
      state,
      pincode,
      selectedTests: Array.isArray(selectedTests) ? selectedTests : [selectedTests],
      collectionType,
      preferredDate,
      timeSlot,
      medicalCondition,
      paymentMethod,
      totalAmount,
      prescription,
      previousReports,
    });

    return res.status(201).json({
      success: true,
      message: "Lab test booking received successfully!",
      data: booking,
    });

  } catch (err) {
    console.log("Lab Test Booking Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};


// -----------------------
// GET ALL LAB TEST BOOKINGS
// -----------------------
export const getAllLabTests = async (req, res) => {
  try {
    const bookings = await LabTest.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: bookings.length,
      labTests: bookings,
    });

  } catch (err) {
    console.log("Fetch Error:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch lab tests",
      error: err.message,
    });
  }
};
