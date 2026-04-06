import express from "express";
import {
  createB2BCategory,
  getB2BCategories,
  getAllB2BCategoriesAdmin,
  updateB2BCategory,
  deleteB2BCategory,
} from "../controllers/b2bCategory.controller.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

/* ===============================
   CREATE (ADMIN)
================================ */
router.post("/create", adminProtect, createB2BCategory);

/* ===============================
   READ (PUBLIC – WEBSITE)
================================ */
router.get("/all", getB2BCategories); 

/* ===============================
   READ (ADMIN – ALL)
================================ */
router.get("/admin/all", adminProtect, getAllB2BCategoriesAdmin);

/* ===============================
   UPDATE (ADMIN)
================================ */
router.put("/update/:id", adminProtect, updateB2BCategory);

/* ===============================
   DELETE (ADMIN)
================================ */
router.delete("/delete/:id", adminProtect, deleteB2BCategory);

export default router;
