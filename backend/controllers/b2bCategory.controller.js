import B2BCategory from "../models/b2bCategory.model.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
/*CREATE B2B CATEGORY */
export const createB2BCategory = async (req, res) => {
  try {
    const { title, slug, redirectUrl, image } = req.body;

    if (!title || !slug || !redirectUrl || !image?.url) {
      return res.status(400).json({
        success: false,
        message: "All fields including image are required",
      });
    }

    const data = await B2BCategory.create({
      title,
      slug,
      redirectUrl,
      image: image.url,
      imagePublicId: image.public_id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Category created",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===============================
   GET ALL ACTIVE B2B
================================ */
export const getB2BCategories = async (req, res) => {
  try {
    const data = await B2BCategory.find({ isActive: true }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllB2BCategoriesAdmin = async (req, res) => {
  try {
    const data = await B2BCategory.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ===============================
   UPDATE / EDIT B2B CATEGORY
================================ */
export const updateB2BCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, redirectUrl, image, isActive } = req.body;

    const category = await B2BCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 🔹 If new image is provided (already uploaded to Cloudinary)
    if (image && image.url && image.public_id) {
      if (category.imagePublicId) {
         await deleteFromCloudinary(category.imagePublicId, "image");      }

      category.image = image.url;
      category.imagePublicId = image.public_id;
    }

    // 🔹 Update other fields
    category.title = title ?? category.title;
    category.slug = slug ?? category.slug;
    category.redirectUrl = redirectUrl ?? category.redirectUrl;

    if (typeof isActive !== "undefined") {
      category.isActive = isActive === true || isActive === "true";
    }

    await category.save();

    res.json({
      success: true,
      message: "Category updated",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===============================
   DELETE B2B CATEGORY
================================ */
export const deleteB2BCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await B2BCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 🔹 delete image from Cloudinary
    if (category.imagePublicId) {
      await deleteFromCloudinary(category.imagePublicId, "image");
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
