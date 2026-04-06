import express from "express";
import Category from "../models/categoryModel.js";
import { adminProtect } from "../middleware/adminAuth.js";

import {
  addCategory,
  getMainCategories,
  getCategories,
  editCategory,
  deleteCategory,
} from "../controllers/AllcategoryController.js";

const router = express.Router();

/* ---------------- ADD CATEGORY ---------------- */
router.post(
  "/add/category",
  (req, res, next) => {
    console.log("ROUTE HIT");
    next();
  },
  adminProtect,
  (req, res, next) => {
    console.log("ADMIN PASSED");
    next();
  },
  
  (req, res, next) => {
    console.log("UPLOAD DONE", req.file);
    next();
  },
  addCategory
);
router.get("/main", getMainCategories);
router.get("/all", getCategories);
router.get("/by-parent", async (req, res) => {
  try {
    const { parent } = req.query;

    if (!parent) {
      return res.status(400).json({
        success: false,
        message: "Parent category id required",
      });
    }

    const categories = await Category.find({
      parentCategory: parent,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      categories,
    });
  } catch (err) {
    console.error("Subcategory fetch error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// GET categories (optionally by parent)
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    console.log(category)
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.put("/edit/:id",adminProtect, editCategory);
router.delete("/delete/:id", deleteCategory);

export default router;
