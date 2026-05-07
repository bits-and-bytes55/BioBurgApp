import cloudinary from "../config/cloudinary.js";
import EmployeeIDCard from "../models/employeeIdCards.js";
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
      photo, cardImage, cardImageBack,
    } = req.body;

    const folder = "bioburg/employee-id-cards";
    const updates = { designation, department, location };

    if (validTill)   updates.validTill   = new Date(validTill);
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

// ── DELETE ────────────────────────────────────────────────────────────────────
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

// ── SOFT DELETE (deactivate) ──────────────────────────────────────────────────
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