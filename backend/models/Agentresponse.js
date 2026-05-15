// models/AgentResponse.js
import mongoose from "mongoose";

const AgentResponseSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingAgent",
      required: true,
    },

    // Place details
    placeName: {
      type: String,
      required: true,
      trim: true,
    },

    placeType: {
      type: String,
      enum: [
        "Hospital",
        "Clinic",
        "Pharmacy",
        "Medical Store",
        "Nursing Home",
        "Diagnostic Centre",
        "Doctor Chamber",
        "Corporate Office",
        "Retail Shop",
        "Wholesaler",
        "Factory",
        "School",
        "Hotel",
        "Other",
      ],
      default: "Hospital",
    },

    address: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    district: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    // Contact details
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    contactRole: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    alternatePhone: {
      type: String,
      default: "",
    },

    whatsappPhone: {
      type: String,
      default: "",
    },

    qualification: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
    },

    dob: {
      type: String,
      default: "",
    },

    anniversary: {
      type: String,
      default: "",
    },

    // Visit outcome
    responseStatus: {
      type: String,
      enum: [
        "Responded - Positive",
        "Responded - Neutral",
        "Responded - Negative",
        "No Response",
        "Callback Requested",
        "Order Placed",
        "Follow Up Required",
        "Not Available",
      ],
      default: "Responded - Positive",
    },

    productDiscussed: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    nextAction: {
      type: String,
      enum: [
        "Call Tomorrow",
        "Visit Again",
        "Send Sample",
        "Send Quotation",
        "None Required",
        "Escalate to Manager",
      ],
      default: "None Required",
    },

    followUpDate: {
      type: Date,
    },

    // Order
    hasOrder: {
      type: Boolean,
      default: false,
    },

    orderValue: {
      type: Number,
      default: 0,
    },

    linkedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleOrder",
      default: null,
    },

    // Points tracking
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

AgentResponseSchema.index({ agentId: 1, createdAt: -1 });
AgentResponseSchema.index({ responseStatus: 1 });
AgentResponseSchema.index({ hasOrder: 1 });

export default mongoose.model("AgentResponse", AgentResponseSchema);