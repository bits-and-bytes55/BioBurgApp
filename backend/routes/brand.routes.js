import express from "express";
import {
  createBrand,
  getAllBrandsAdmin,
  getActiveBrands,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller.js";
import { adminProtect } from "../middleware/adminAuth.js";


const router = express.Router();



router.post("/create", adminProtect, createBrand);
router.put("/update/:id", adminProtect, updateBrand);
router.delete("/delete/:id", adminProtect, deleteBrand);

router.get("/admin/all", adminProtect, getAllBrandsAdmin);
router.get("/active", getActiveBrands);

export default router;
