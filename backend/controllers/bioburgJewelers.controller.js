import BioburgJewelers from "../models/bioburgJwelers.model.js";
import { v2 as cloudinary } from "cloudinary";

/* =======================
   CREATE BIOBURG JEWELERS
======================= */
export const createBioburgJewelers = async (req, res) => {
  try {
    const { name, redirectUrl, logo } = req.body;

    if (!name || !logo?.url) {
      return res.status(400).json({
        success: false,
        message: "Name and logo are required",
      });
    }

    // 🔒 Duplicate check
    const exists = await BioburgJewelers.findOne({ name });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Bioburg Jewelers already exists",
      });
    }

    const brand = await BioburgJewelers.create({
      name,
      redirectUrl,
      logo: logo.url,
      logoPublicId: logo.public_id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Bioburg Jewelers created",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================
   ADMIN : GET ALL
======================= */
export const getAllBioburgJewelersAdmin = async (req, res) => {
  try {
    const data = await BioburgJewelers.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================
   WEBSITE : ONLY ACTIVE
======================= */
export const getActiveBioburgJewelers = async (req, res) => {
  try {
    const data = await BioburgJewelers.find({ isActive: true }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================
   UPDATE BIOBURG JEWELERS
======================= */
export const updateBioburgJewelers = async (req, res) => {
  try {
    const { name, redirectUrl, logo, isActive } = req.body;

    const brand = await BioburgJewelers.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Bioburg Jewelers not found",
      });
    }

    // 🔁 Logo update (Cloudinary)
    if (logo?.url && logo?.public_id) {
      if (brand.logoPublicId) {
        await cloudinary.uploader.destroy(brand.logoPublicId);
      }
      brand.logo = logo.url;
      brand.logoPublicId = logo.public_id;
    }

    // ✏️ Fields update
    if (name) brand.name = name;
    if (redirectUrl !== undefined) brand.redirectUrl = redirectUrl;
    if (typeof isActive !== "undefined") {
      brand.isActive = isActive === true || isActive === "true";
    }

    await brand.save();

    res.json({
      success: true,
      message: "Bioburg Jewelers updated",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================
   DELETE BIOBURG JEWELERS
======================= */
export const deleteBioburgJewelers = async (req, res) => {
  try {
    const brand = await BioburgJewelers.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Bioburg Jewelers not found",
      });
    }

    // Delete from Cloudinary
    if (brand.logoPublicId) {
      await cloudinary.uploader.destroy(brand.logoPublicId);
    }

    await brand.deleteOne();

    res.json({
      success: true,
      message: "Bioburg Jewelers deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
