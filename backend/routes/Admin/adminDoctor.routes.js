import express from "express";
import {
  getAllDoctors,
  getPendingDoctors,
  getDoctorById,
  approveDoctor,
  rejectDoctor,
  toggleBlockDoctor,
  getAdminDashboard,
  getAllConsultations,
  closeConsultation,
  openConsultation,
} from "../../controllers/Doctors/admin/adminDoctor.controller.js";
import { adminProtect } from "../../middleware/adminAuth.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", adminProtect, getAdminDashboard);

// Doctors
router.get("/doctors", adminProtect, getAllDoctors);
router.get("/doctors/pending", adminProtect, getPendingDoctors);
router.get("/doctors/:id", adminProtect, getDoctorById);
router.put("/doctors/:id/approve", adminProtect, approveDoctor);
router.put("/doctors/:id/reject", adminProtect, rejectDoctor);
router.put("/doctors/:id/block", adminProtect, toggleBlockDoctor);

// Consultations (Admin view)
router.get("/doctor-consultations",       adminProtect, getAllConsultations);
router.put("/consultations/:id/close",    adminProtect, closeConsultation);
router.put("/consultations/:id/open",     adminProtect, openConsultation);

export default router;