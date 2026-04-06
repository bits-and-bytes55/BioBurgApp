import Partner from "../../models/radiology/Partner.model.js";
import cloudinary from "../../config/cloudinary.js";

/**
 * REGISTER PARTNER
 */
export const registerPartner = async (req, res) => {
  try {
    if (!req.body.consent) {
      return res.status(400).json({
        success: false,
        message: "Consent is required",
      });
    }

    const partner = await Partner.create({
      ...req.body,
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully",
      partnerId: partner._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE DOCUMENT (Cloudinary + DB)
 */
export const deletePartnerDocument = async (req, res) => {
  const { partnerId, field } = req.body;

  const partner = await Partner.findById(partnerId);
  if (!partner || !partner[field]) {
    return res.status(404).json({ success: false });
  }

  await cloudinary.uploader.destroy(partner[field].public_id);

  partner[field] = null;
  await partner.save();

  res.json({
    success: true,
    message: "Document deleted successfully",
  });
};


export const getPartnerProfile = async (req, res) => {
  try {
    const partnerId = req.user.partnerId; // JWT se

    const partner = await Partner.findById(partnerId).select("-__v");

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

