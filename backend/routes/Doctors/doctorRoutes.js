// backend/routes/Doctors/doctorRoutes.js 
import express from "express";
import {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  uploadDoctorPhoto,
  deleteDoctorPhoto,
  doctorDashboardStats,
  getApprovedDoctors,
  toggleAvailability,
  adminDeleteDoctor,
  getDoctorActivity, 
} from "../../controllers/Doctors/doctorController.js";
import protectDoctor from "../../middleware/Doctors/doctorauthMiddleware.js";
import availabilityRoutes  from "./availabilityroutes.js";
import consultationRoutes  from "./consultationroutes.js";
import prescriptionRoutes  from "./prescriptionroutes.js";
import walletRoutes        from "./walletRoutes.js";

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────────────
router.post("/register",   registerDoctor);
router.post("/login",      loginDoctor);
router.get("/approved",    getApprovedDoctors); 
// ── Protected ────────────────────────────────────────────────────────────────
router.get("/profile",        protectDoctor, getDoctorProfile);
router.put("/profile",        protectDoctor, updateDoctorProfile);   
router.post("/profile/photo", protectDoctor, uploadDoctorPhoto);     
router.delete("/profile/photo", protectDoctor, deleteDoctorPhoto);   
router.get("/dashboard",      protectDoctor, doctorDashboardStats);
router.patch("/toggle-availability", protectDoctor, toggleAvailability);
router.get("/activity", protectDoctor, getDoctorActivity);


// ── Sub-routers ───────────────────────────────────────────────────────────────
router.use("/availability",  availabilityRoutes);
router.use("/consultations", consultationRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/wallet",        walletRoutes);

// ── Admin only (add your adminProtect middleware as needed) ───────────────────
router.delete("/admin/:id", adminDeleteDoctor);

export default router;