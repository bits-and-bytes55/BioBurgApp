import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name          : { type: String, required: true },
  contactPerson : String,
  designation   : String,
  mobile        : String,
  email         : String,
  opdTimings    : String,
  remarks       : String,
}, { timestamps: true });

const tenderSchema = new mongoose.Schema({
  tenderNo       : String,
  description    : String,
  products       : [String],
  quantity       : String,
  estimatedValue : String,
  submissionDate : Date,
  resultDate     : Date,
  status         : {
    type   : String,
    enum   : ["Open", "Submitted", "Won", "Lost", "Cancelled", "Pending"],
    default: "Open",
  },
  remarks: String,
}, { timestamps: true });

const visitSchema = new mongoose.Schema({
  date          : { type: Date, default: Date.now },
  visitTime     : String,
  contactPerson : String,
  purposeOfVisit: String,
  productsDetailed: [{ name: String, quantity: { type: Number, default: 1 } }],
  outcome       : String,
  nextVisitDate : Date,
  remarks       : String,
}, { timestamps: true });

const hospitalSchema = new mongoose.Schema(
  {
    agent: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "MarketingAgent",
      required: true,
    },

    // Core info
    name            : { type: String, required: true },
    hospitalType    : { type: String, default: "Private" }, // Government/Private/Trust/Corporate/Other
    registrationNo  : String,
    bedCount        : Number,

    // Contact
    mobile          : String,
    alternatePhone  : String,
    email           : String,
    website         : String,

    // Location
    address         : String,
    area            : String,
    territory       : String,
    district        : String,
    state           : String,

    // Purchase/Supply
    purchaseManager       : String,
    purchaseManagerMobile : String,
    purchaseManagerEmail  : String,
    productsApproved      : [String],
    monthlySupplyValue    : String,

    // Classification
    category    : { type: String, enum: ["A", "B", "C"], default: "B" },
    potential   : { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },

    isActive    : { type: Boolean, default: true },

    departments  : [departmentSchema],
    tenders      : [tenderSchema],
    visitHistory : [visitSchema],
  },
  { timestamps: true }
);

hospitalSchema.virtual("totalVisits").get(function () {
  return this.visitHistory.length;
});
hospitalSchema.virtual("lastVisitDate").get(function () {
  if (!this.visitHistory.length) return null;
  return this.visitHistory[this.visitHistory.length - 1].date;
});
hospitalSchema.set("toJSON", { virtuals: true });

export default mongoose.model("CRMHospital", hospitalSchema);