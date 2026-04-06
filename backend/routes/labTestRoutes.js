import express from "express";
import multer from "multer";
import { createLabTestBooking, getAllLabTests } from "../controllers/labTestController.js";

const router = express.Router();

// FILE UPLOAD SETUP
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/labtests/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ROUTES
router.post(
  "/book",
  upload.fields([
    { name: "prescription", maxCount: 1 },
    { name: "previousReports", maxCount: 1 },
  ]),
  createLabTestBooking
);

router.get("/all", getAllLabTests);

export default router;
