import express from "express";
import Category from "../models/categoryModel.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate("parentCategory", "title")
      .sort({ title: 1 });

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/sub/:parent", async (req, res) => {
  try {
    const { parent } = req.params;

    const parentCat = parent.match(/^[0-9a-fA-F]{24}$/)
      ? await Category.findById(parent)
      : await Category.findOne({
          title: { $regex: new RegExp(`^${parent}$`, "i") },
        });

    if (!parentCat) {
      return res.json({ success: true, categories: [] });
    }

    const subCategories = await Category.find({
      parentCategory: parentCat._id,
    }).sort({ title: 1 });

    res.json({ success: true, categories: subCategories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parentCategory",
      "title"
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
