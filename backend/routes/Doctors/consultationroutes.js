
import express from "express";
import {
  getConsultations,
  updateConsultationStatus,
  createConsultation,
} from "../../controllers/Doctors/consultationcontroller.js";
import protectDoctor from "../../middleware/Doctors/doctorauthMiddleware.js";

const router = express.Router();
router.get("/", protectDoctor, getConsultations);
router.put("/:id/status", protectDoctor, updateConsultationStatus);
router.post("/book", createConsultation);

export default router;