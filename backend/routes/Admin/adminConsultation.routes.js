import express from "express";
import {
  getAllConsultations,
  closeConsultation,
  openConsultation,
  getPendingConsultations,
  updateConsultationStatus,
} from "../../controllers/Doctors/admin/adminConsultation.controller.js"; 
import { adminProtect } from "../../middleware/adminAuth.js";
 
const router = express.Router();
 
router.get("/doctor-consultations", adminProtect, getAllConsultations);
router.get("/doctor-consultations/pending", adminProtect, getPendingConsultations);
router.put("/consultations/:id/close", adminProtect, closeConsultation);
router.put("/consultations/:id/open", adminProtect, openConsultation);
router.put("/consultations/:id/status", adminProtect, updateConsultationStatus);
 
export default router;
 
