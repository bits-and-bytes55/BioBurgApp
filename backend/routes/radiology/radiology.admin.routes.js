import express from "express";
import {
  getAllPartners,
  getPendingPartners,
  approvePartner,
  rejectPartner,
  getAllRadiologyCenters,
  getPendingRadiologyCenters,
  getAllRadiologyBookings,
  getAllRadiologyReports
} from "../../controllers/Radiology/admin.controller.js";
import { adminProtect } from "../../middleware/adminAuth.js";

const router = express.Router();


router.get("/partners", adminProtect,getAllPartners); 
router.get("/partners/pending", adminProtect,getPendingPartners);
router.post("/partners/approve", adminProtect,approvePartner);
router.post("/partners/reject", adminProtect,rejectPartner);
router.get("/centers", getAllRadiologyCenters);
router.get("/centers/pending", getPendingRadiologyCenters);
router.get("/bookings", getAllRadiologyBookings);
router.get("/reports", getAllRadiologyReports);

export default router;
