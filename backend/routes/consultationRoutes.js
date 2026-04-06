import express from "express";
import { getConsultations, addConsultation, getPatients, addPatient, updatePatient } from "../controllers/consultationController.js";
import { protect } from "../middleware/profilemiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getConsultations);
router.post("/", addConsultation);

router.get("/patients", getPatients);
router.post("/patients", addPatient);
router.put("/patients/:id", updatePatient);

export default router;
