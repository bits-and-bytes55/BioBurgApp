// routes/zoneRoutes.js
import express from "express";
import {
  createZone,
  getAllZones
} from "../controllers/zoneController.js";

const router = express.Router();

// ✅ GET ALL ZONES (Admin + Franchise both)
router.get("/", getAllZones);

// ✅ CREATE ZONE (Admin)
router.post("/create", createZone);

export default router;
