import mongoose from "mongoose";
const BookingSchema = new mongoose.Schema(
  {
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: false,   
  default: null,
},
partnerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Partner",
  required: false,   
  default: null,
},

    fullName: String,
    mobile: String,
    email: String,
    dob: String,
    gender: String,

    scanTypes: [String],
    bodyPart: String,
    contrast: String,
    clinicalIndication: String,

    claustrophobia: String,
    pregnant: String,
    pacemaker: String,
    metalImplants: String,
    kidneyDisease: String,

    allergies: [String],
    medHistory: String,

    refDocName: String,
    refDocSpec: String,

    apptDate: String,
    apptSlot: String,
    paymentMode: String,

    status: {
      type: String,
      enum: [
        "PENDING",
        "BOOKED",
        "CONFIRMED",
        "PROCESSING",
        "COMPLETED",
        "REPORT_READY",
        "CANCELLED",
      ],
      default: "PENDING",
    },
  },
  { timestamps: true },
);
export default mongoose.model("Booking", BookingSchema);
