import Bookings from "../../models/pathology/Booking.js";

export const createBooking = async (req, res) => {
  try {
    const {
      labId,
      patientName,
      patientMobile,
      testName,
      bookingDate,
    } = req.body;

    if (!labId || !patientName || !patientMobile || !testName || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const booking = await Bookings.create({
      labId,
      patientName,
      patientMobile,
      testName,
      bookingDate,
    });

    res.status(201).json({
      success: true,
      message: "Booking created",
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Bookings.find({
      labId: req.lab._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Bookings.findOneAndUpdate(
      {
        _id: req.params.id,
        labId: req.lab._id,
      },
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      success: true,
      message: "Status updated",
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
