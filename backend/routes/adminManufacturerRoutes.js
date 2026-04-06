import express from "express";
import {
  getAllManufacturers,
  getManufacturerOwnedProducts,
  getManufacturerSummary,
  getPendingManufacturers,
  approveManufacturer,
  updateManufacturerStatus,
  deleteManufacturer,
} from "../controllers/adminManufacturerController.js";

import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/summary", adminProtect, getManufacturerSummary);
router.get("/products", adminProtect, getManufacturerOwnedProducts);
router.get("/", adminProtect, getAllManufacturers);
router.get("/pending", adminProtect, getPendingManufacturers);
router.put("/approve/:id", adminProtect, approveManufacturer);
router.patch("/:id/status", adminProtect, updateManufacturerStatus);
router.delete("/:id", adminProtect, deleteManufacturer);

export default router;
