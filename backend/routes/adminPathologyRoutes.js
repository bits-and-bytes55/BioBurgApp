// routes/adminPathologyRoutes.js
import express from "express";
import {
  getAllLabs,
  updateLabStatus,
} from "../controllers/pathologyAdminController.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/labs", adminProtect, getAllLabs);
router.patch("/labs/:id/status", adminProtect, updateLabStatus);

export default router;
