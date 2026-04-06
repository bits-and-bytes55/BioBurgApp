import express from "express";
import {
  createBioburgJewelers,
  getAllBioburgJewelersAdmin,
  getActiveBioburgJewelers,
  updateBioburgJewelers,
  deleteBioburgJewelers,
} from "../controllers/bioburgJewelers.controller.js";

import { adminProtect } from "../middleware/adminAuth.js";
const router = express.Router();

router.post("/create", adminProtect, createBioburgJewelers);
router.put("/update/:id", adminProtect, updateBioburgJewelers);
router.delete("/delete/:id", adminProtect, deleteBioburgJewelers);

router.get("/admin/all", adminProtect, getAllBioburgJewelersAdmin);
router.get("/active", getActiveBioburgJewelers);

export default router;
