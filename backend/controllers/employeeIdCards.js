import cloudinary from "../config/cloudinary.js";
import EmployeeIDCard from "../models/employeeIdCards.js";
import IDCardSettings from "../models/idCardSettings.js";
import DeliveryAgent from "../models/DeliveryAgent.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js"; 


const uploadBase64 = async (base64DataUrl, folder, publicIdPrefix) => {
  if (!base64DataUrl) return { url: null, publicId: null };

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder,
    public_id:      `${publicIdPrefix}_${Date.now()}`,
    resource_type:  "image",
    overwrite:      true,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return { url: result.secure_url, publicId: result.public_id };
};

const uploadSettingImageIfBase64 = async (value, oldPublicId, field) => {
  if (!value) return {};

  if (!value.startsWith("data:")) {
    return { [field]: value };
  }

  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }

  const { url, publicId } = await uploadBase64(
    value,
    "bioburg/id-card-settings",
    field
  );

  return {
    [field]: url,
    [`${field}PublicId`]: publicId,
  };
};

export const getIDCardSettings = async (req, res) => {
  try {
    let settings = await IDCardSettings.findOne();

    if (!settings) {
      settings = await IDCardSettings.create({});
    }

    return res.json({ success: true, settings });
  } catch (err) {
    console.error("getIDCardSettings error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateIDCardSettings = async (req, res) => {
  try {
    let settings = await IDCardSettings.findOne();

    if (!settings) {
      settings = await IDCardSettings.create({});
    }

    const body = req.body || {};

    const imageUpdates = {
      ...(await uploadSettingImageIfBase64(body.frontLogo, settings.frontLogoPublicId, "frontLogo")),
      ...(await uploadSettingImageIfBase64(body.backLogo, settings.backLogoPublicId, "backLogo")),
      ...(await uploadSettingImageIfBase64(body.authorityStamp, settings.authorityStampPublicId, "authorityStamp")),
    };

    const updates = {
      companyName: body.companyName,
      subtitle: body.subtitle,
      cardColors: body.cardColors,
      mottoTitle: body.mottoTitle,
      mottos: body.mottos,
      termsTitle: body.termsTitle,
      termsText: body.termsText,
      returnTitle: body.returnTitle,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      email: body.email,
      phone: body.phone,
      website: body.website,
      footerNote: body.footerNote,
      ...imageUpdates,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const updated = await IDCardSettings.findByIdAndUpdate(settings._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({ success: true, settings: updated });
  } catch (err) {
    console.error("updateIDCardSettings error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getDeliveryAgentsForIDCards = async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({
      status: { $in: ["approved", "pending", "draft"] },
      isActive: true,
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const cards = await EmployeeIDCard.find({
      sourceModel: "DeliveryAgent",
      isActive: true,
    })
      .select("employeeRef employeeId name cardImage cardImageBack issuedAt isActive")
      .lean();

    const issuedMap = new Map(
      cards.map((card) => [String(card.employeeRef), card])
    );

    const data = agents.map((agent) => {
      const issuedCard = issuedMap.get(String(agent._id)) || null;

      return {
        _id: agent._id,
        id: agent._id,

        employeeRef: agent._id,
        employeeId: agent.agentId || String(agent._id).slice(-8).toUpperCase(),

        sourceModel: "DeliveryAgent",
        source: "Delivery Agent",

        name: agent.name || "-",
        email: agent.email || "",
        phone: agent.phone || "",
        photo: agent.documents?.passportPhoto || "",

        designation: "Delivery Agent",
        department: "Delivery",
        location: agent.assignedArea || "India",

        agentId: agent.agentId,
        assignedArea: agent.assignedArea,
        vehicleType: agent.vehicleType,
        vehicleNumber: agent.vehicleNumber,
        drivingLicence: agent.drivingLicence,
        panCard: agent.panCard,
        personalInsuranceNumber: agent.personalInsuranceNumber,
        vehicleInsuranceNumber: agent.vehicleInsuranceNumber,
        documents: agent.documents,
        status: agent.status,

        hasIDCard: Boolean(issuedCard),
        alreadyIssuedCard: issuedCard,
        idCard: issuedCard,

        rawData: agent,
        createdAt: agent.createdAt,
      };
    });

    return res.json({
      success: true,
      agents: data,
      data,
      total: data.length,
    });
  } catch (err) {
    console.error("getDeliveryAgentsForIDCards error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export const getDriverIDCard = async (req, res) => {
  try {
    const card = await EmployeeIDCard.findOne({
      employeeRef: req.params.agentId,
      sourceModel: "DeliveryAgent",
      isActive: true,
    })
      .sort({ issuedAt: -1 })
      .lean();

    return res.json({
      success: true,
      card: card || null,
      data: card || null,
    });
  } catch (err) {
    console.error("getDriverIDCard error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};



//  CREATE — issue a new ID card 
export const issueIDCard = async (req, res) => {
  try {
    const {
      employeeRef, sourceModel, employeeId,
      name, email, phone, source,
      designation, department, location, validTill, dateOfBirth,
      photo,
      cardImage,
      cardImageBack,
      cardColors,
      cardGlobalContent,
      issuedAt,

    } = req.body;

    if (!employeeId || !name) {
      return res.status(400).json({ success: false, message: "employeeId and name are required" });
    }

    // Upload front card (required)
    if (!cardImage) {
      return res.status(400).json({ success: false, message: "cardImage (front) is required" });
    }

    const folder = "bioburg/employee-id-cards";

    const [frontUpload, backUpload, photoUpload] = await Promise.all([
      uploadBase64(cardImage,     folder, `front_${employeeId}`),
      uploadBase64(cardImageBack, folder, `back_${employeeId}`),
      // Only upload photo if it is base64; if already a URL, keep as-is
      photo && photo.startsWith("data:")
        ? uploadBase64(photo, "bioburg/employee-photos", `photo_${employeeId}`)
        : Promise.resolve({ url: photo || null, publicId: null }),
    ]);

    const card = await EmployeeIDCard.create({
      employeeRef,
      sourceModel,
      employeeId,
      name, email, phone, source,
      designation, department, location,
      validTill:  validTill  ? new Date(validTill)  : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      photo:           photoUpload.url,
      photoPublicId:   photoUpload.publicId,
      cardImage:          frontUpload.url,
      cardImagePublicId:  frontUpload.publicId,
      cardImageBack:         backUpload.url,
      cardImageBackPublicId: backUpload.publicId,
      cardColors,
      cardGlobalContent,
      issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
    });

    return res.status(201).json({ success: true, card });
  } catch (err) {
    console.error("issueIDCard error:", err);

    // Handle duplicate employeeId
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Employee ID already exists" });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllIDCards = async (req, res) => {
  try {
    const { search, source, active } = req.query;

    const filter = {};
    if (active !== undefined) filter.isActive = active === "true";
    if (source && source !== "all") filter.source = source;
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email:      { $regex: search, $options: "i" } },
      ];
    }

    const cards = await EmployeeIDCard.find(filter).sort({ issuedAt: -1 });
    return res.json({ success: true, cards });
  } catch (err) {
    console.error("getAllIDCards error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getIDCardById = async (req, res) => {
  try {
    const card = await EmployeeIDCard.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    return res.json({ success: true, card });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const reissueIDCard = async (req, res) => {
  try {
    const card = await EmployeeIDCard.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });

    const {
      designation, department, location, validTill, dateOfBirth,
      photo, cardImage, cardImageBack, cardColors, cardGlobalContent,

    } = req.body;

    const folder = "bioburg/employee-id-cards";
const updates = {};

if (designation !== undefined) updates.designation = designation;
if (department !== undefined) updates.department = department;
if (location !== undefined) updates.location = location;

if (cardColors) updates.cardColors = cardColors;
if (cardGlobalContent) updates.cardGlobalContent = cardGlobalContent;

if (validTill) updates.validTill = new Date(validTill);
if (dateOfBirth) updates.dateOfBirth = new Date(dateOfBirth);


    // Re-upload front if new base64 provided
    if (cardImage && cardImage.startsWith("data:")) {
      await deleteFromCloudinary(card.cardImagePublicId);
      const { url, publicId } = await uploadBase64(cardImage, folder, `front_${card.employeeId}`);
      updates.cardImage         = url;
      updates.cardImagePublicId = publicId;
    }

    // Re-upload back if new base64 provided
    if (cardImageBack && cardImageBack.startsWith("data:")) {
      await deleteFromCloudinary(card.cardImageBackPublicId);
      const { url, publicId } = await uploadBase64(cardImageBack, folder, `back_${card.employeeId}`);
      updates.cardImageBack         = url;
      updates.cardImageBackPublicId = publicId;
    }

    // Re-upload photo if new base64 provided
    if (photo && photo.startsWith("data:")) {
      await deleteFromCloudinary(card.photoPublicId);
      const { url, publicId } = await uploadBase64(photo, "bioburg/employee-photos", `photo_${card.employeeId}`);
      updates.photo         = url;
      updates.photoPublicId = publicId;
    }

    updates.issuedAt = new Date(); // refresh issue date

    const updated = await EmployeeIDCard.findByIdAndUpdate(req.params.id, updates, { new: true });
    return res.json({ success: true, card: updated });
  } catch (err) {
    console.error("reissueIDCard error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE 
export const deleteIDCard = async (req, res) => {
  try {
    const card = await EmployeeIDCard.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });

    // Delete all 3 Cloudinary assets in parallel
    await Promise.all([
      deleteFromCloudinary(card.cardImagePublicId),
      deleteFromCloudinary(card.cardImageBackPublicId),
      deleteFromCloudinary(card.photoPublicId),
    ]);

    await EmployeeIDCard.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "ID card deleted successfully" });
  } catch (err) {
    console.error("deleteIDCard error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  SOFT DELETE (deactivate) 
export const deactivateIDCard = async (req, res) => {
  try {
    const card = await EmployeeIDCard.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    return res.json({ success: true, message: "Card deactivated", card });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};