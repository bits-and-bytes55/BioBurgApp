import AgentResponse from "../models/Agentresponse.js";
import { awardPoints } from "../utils/awardPoints.js";

// helper — middleware sets req.user = { id, role }
const getAgentId = (req) => req.user?.id || req.user?._id;

//  GET /api/agent/responses
export const getMyResponses = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const responses = await AgentResponse.find({ agentId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, responses });
  } catch (err) {
    console.error("[getMyResponses]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/agent/responses 
export const createResponse = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const {
  // Place
  placeName,
  placeType,
  address,
  state,
  district,
  city,
  pincode,

  // Contact
  contactPerson,
  contactRole,
  phone,
  alternatePhone,
  whatsappPhone,
  qualification,
  designation,
  dob,
  anniversary,

  // Visit
  responseStatus,
  productDiscussed,
  remarks,
  nextAction,
  followUpDate,

  gst,
  licenses,

  // Order
  hasOrder,
  orderValue,
  linkedOrderId,
} = req.body;

    if (!placeName || !contactPerson || !phone) {
      return res.status(400).json({
        success: false,
        message: "Place name, contact person and phone are required",
      });
    }

    // Save the response
  const response = await AgentResponse.create({
  agentId,

  // Place
  placeName,
  placeType: placeType || "Hospital",
  address: address || "",
  state: state || "",
  district: district || "",
  city: city || "",
  pincode: pincode || "",
  contactPerson,
contactRole: contactRole || "",
phone: phone || "",
alternatePhone: alternatePhone || "",
whatsappPhone: whatsappPhone || "",
gst: gst || "",
licenses: Array.isArray(licenses)
  ? licenses.filter(Boolean)
  : [],
qualification: qualification || "",
designation: designation || "",
dob: dob || "",
anniversary: anniversary || "",

  // Visit
  responseStatus,
  productDiscussed: productDiscussed || "",
  remarks: remarks || "",
  nextAction,

  followUpDate: followUpDate || undefined,

  // Order
  hasOrder: !!hasOrder,

  orderValue:
    hasOrder && !isNaN(Number(orderValue))
      ? Number(orderValue)
      : 0,

  linkedOrderId: linkedOrderId || null,
});
    // Auto-award points
    const baseEntry = await awardPoints(
      agentId,
      "response_submitted",
      response._id.toString(),
      "AgentResponse",
      `Response logged: ${placeName}`
    );

    //Bonus if order was received at the visit
    let orderEntry = null;
    if (hasOrder) {
      orderEntry = await awardPoints(
        agentId,
        "order_placed",
        response._id.toString(),
        "AgentResponse",
        `Order received at ${placeName} — ₹${orderValue || 0}`
      );
    }

    //Bonus for positive response
    if (responseStatus === "Responded - Positive") {
      await awardPoints(
        agentId,
        "lead_submitted",
        response._id.toString(),
        "AgentResponse",
        `Positive lead: ${placeName}`
      );
    }

    // Total points awarded this submission
    const pointsAwarded =
      (baseEntry?.points || 0) +
      (orderEntry?.points || 0);

    // Store on the response document for admin reference
    await AgentResponse.findByIdAndUpdate(response._id, { pointsAwarded });

    return res.status(201).json({
      success: true,
      response: { ...response.toObject(), pointsAwarded },
      pointsAwarded,
    });
  } catch (err) {
    console.error("[createResponse]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};