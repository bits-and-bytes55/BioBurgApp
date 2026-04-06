

import express from "express";
import {
  createPrescription,
  getPrescriptions,
  downloadPrescriptionPDF,
} from "../../controllers/Doctors/prescriptioncontroller.js";
import protectDoctor from "../../middleware/Doctors/doctorauthMiddleware.js";

const router = express.Router();
router.post("/", protectDoctor, createPrescription);
router.get("/", protectDoctor, getPrescriptions);
router.get("/:id/pdf", downloadPrescriptionPDF); 

export default router;