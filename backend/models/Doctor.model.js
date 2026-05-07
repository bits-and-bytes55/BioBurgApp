import mongoose from "mongoose";

const callHistorySchema = new mongoose.Schema({
  date          : { type: Date, default: Date.now },
  visitTime     : String,
  productsDetailed: [{ name: String, quantity: { type: Number, default: 1 } }],
  samplesGiven  : [{ productName: String, quantity: { type: Number, default: 1 } }],
  doctorFeedback: String,
  nextVisitDate : Date,
  orderPlaced   : { type: Boolean, default: false },
  orderValue    : String,
  remarks       : String,
  callType: {
    type: String,
    enum: ["Face To Face", "Virtual Meeting", "Phone Call", "Joint Field Work"],
    default: "Face To Face",
  },
}, { timestamps: true });

const rcpaSchema = new mongoose.Schema({
  date                   : { type: Date, default: Date.now },
  chemistName            : String,
  chemistArea            : String,
  ourProduct             : String,
  ourPrescriptions       : { type: Number, default: 0 },
  competitorProduct      : String,
  competitorPrescriptions: { type: Number, default: 0 },
  remarks                : String,
}, { timestamps: true });

const feedbackSchema = new mongoose.Schema({
  date    : { type: Date, default: Date.now },
  product : String,
  feedback: String,
  rating  : { type: Number, min: 1, max: 5, default: 3 },
  remarks : String,
}, { timestamps: true });

const doctorSchema = new mongoose.Schema(
  {
    agent: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "MarketingAgent",
      required: true,
    },

    // Core info
    name                  : { type: String, required: true },
    qualification         : String,   // MBBS, MD, MS Ortho …
    specialty             : String,   // General Physician, Cardiologist …
    clinicName            : String,
    hospitalAttached      : String,

    // Contact
    mobile   : String,
    whatsapp : String,
    email    : String,

    // Location
    address  : String,
    area     : String,
    territory: String,
    district : String,
    state    : String,

    // OPD & potential
    opdTimings           : String,   // "10am–1pm"
    prescriptionPotential: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    category             : { type: String, enum: ["A", "B", "C"], default: "B" },

    isActive  : { type: Boolean, default: true },

    // Sub-documents
    callHistory: [callHistorySchema],
    rcpa       : [rcpaSchema],
    feedback   : [feedbackSchema],
  },
  { timestamps: true }
);

// Virtual: total visits & last visit date
doctorSchema.virtual("totalVisits").get(function () {
  return this.callHistory.length;
});
doctorSchema.virtual("lastVisitDate").get(function () {
  if (!this.callHistory.length) return null;
  return this.callHistory[this.callHistory.length - 1].date;
});

doctorSchema.set("toJSON", { virtuals: true });

export default mongoose.model("CRMDoctor", doctorSchema);