import express from "express";
import { getAvailability, saveAvailability } from "../../controllers/Doctors/availabilitycontroller.js";
import protectDoctor from "../../middleware/Doctors/doctorauthMiddleware.js";

const router = express.Router();
router.get("/", protectDoctor, getAvailability);
router.post("/", protectDoctor, saveAvailability);

export default router;