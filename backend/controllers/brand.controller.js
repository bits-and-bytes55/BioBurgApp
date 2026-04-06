import Brand from "../models/brand.model.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
/*CREATE BRAND */
export const createBrand = async (req, res) => {
  try {
    const { name, redirectUrl, logo } = req.body;

    if (!name || !logo?.url) {
      return res.status(400).json({
        success: false,
        message: "Name and logo are required",
      });
    }

    //  Duplicate check
    const exists = await Brand.findOne({ name });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const brand = await Brand.create({
      name,
      redirectUrl,
      logo: logo.url,
      logoPublicId: logo.public_id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Brand created",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ADMIN : GET ALL BRANDS*/
export const getAllBrandsAdmin = async (req, res) => {
  try {
    const data = await Brand.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*WEBSITE : ONLY ACTIVE*/
export const getActiveBrands = async (req, res) => {
  try {
    const data = await Brand.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* UPDATE BRAND*/
export const updateBrand = async (req, res) => {
  try {
    const { name, redirectUrl, logo, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    //Logo update (Cloudinary)
    if (logo?.url && logo?.public_id) {
      if (brand.logoPublicId) {
        await deleteFromCloudinary(brand.logoPublicId, "image");
      }
      brand.logo = logo.url;
      brand.logoPublicId = logo.public_id;
    }

    // Fields update
    if (name) brand.name = name;
    if (redirectUrl !== undefined) brand.redirectUrl = redirectUrl;
    if (typeof isActive !== "undefined") {
      brand.isActive = isActive === true || isActive === "true";
    }

    await brand.save();

    res.json({
      success: true,
      message: "Brand updated",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* DELETE BRAND*/
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Delete from Cloudinary
    if (brand.logoPublicId) {
      await cloudinary.uploader.destroy(brand.logoPublicId);
    }

    await brand.deleteOne();

    res.json({
      success: true,
      message: "Brand deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
