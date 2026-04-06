import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";

/* -----------------------------------------
   ADD CATEGORY 
-------------------------------------------- */
export const addCategory = async (req, res) => {
  console.log("CONTROLLER START");
  console.log("BODY:", req.body);
  console.log("CONTENT TYPE:", req.headers["content-type"]);

  try {
    const { title, offer, parentCategory, image } = req.body;

    // BASIC VALIDATION
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!image || !image.url || !image.public_id) {
      return res.status(400).json({
        success: false,
        message: "Image data is required",
      });
    }

    // 🔹 Parent category safe handling
    let parentId = null;
    if (parentCategory && mongoose.Types.ObjectId.isValid(parentCategory)) {
      parentId = new mongoose.Types.ObjectId(parentCategory);
    }

    // 🔹 Create category (IMAGE ALREADY ON CLOUD)
    const category = new Category({
      title: title.trim(),
      offer: Number(offer) || 0,
      parentCategory: parentId,
      image: {
        url: image.url,
        public_id: image.public_id,
      },
    });

    await category.save();

    console.log("CATEGORY SAVED");

    return res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Add category error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Category add failed",
    });
  }
};


/* -----------------------------------------
   GET MAIN CATEGORIES
-------------------------------------------- */
export const getMainCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      parentCategory: null,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Main category fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch main categories",
    });
  }
};

/* -----------------------------------------
   GET ALL CATEGORIES
-------------------------------------------- */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.json(categories);
  } catch (err) {
    console.error("Get categories error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/* -----------------------------------------
   EDIT CATEGORY
-------------------------------------------- */
export const editCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const { title, offer, image } = req.body;

    let updateData = {
      title: title ?? cat.title,
      offer: offer ?? cat.offer,
    };

    // 🔹 If new image is provided (already uploaded to Cloudinary)
    if (image && image.url && image.public_id) {
      // delete old image from cloudinary
      if (cat.image?.public_id) {
        await deleteFromCloudinary(cat.image.public_id, "image");
      }

      updateData.image = {
        url: image.url,
        public_id: image.public_id,
      };
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    return res.json({
      success: true,
      category: updated,
    });
  } catch (err) {
    console.error("Edit category error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Update failed",
    });
  }
};


/* -----------------------------------------
   DELETE CATEGORY (Cloudinary delete)
-------------------------------------------- */
export const deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 🔹 delete image from cloudinary
    if (cat.image?.public_id) {
      await deleteFromCloudinary(cat.image.public_id, "image");
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete category error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Delete failed",
    });
  }
};





