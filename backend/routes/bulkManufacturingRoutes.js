import express from "express";
import multer from "multer";
import { createBulkManufacturingRequest } from "../controllers/bulkManufacturingController.js";
import { storage, withUploadFolder } from "../middleware/upload.js";

const router = express.Router();

const bulkUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post(
  "/",
  withUploadFolder("partner-documents/bulk-manufacturing"),
  bulkUpload.fields([
    { name: "importLicenseFile", maxCount: 1 },
    { name: "gdpCert", maxCount: 1 },
    { name: "buyerLetter", maxCount: 1 },
    { name: "proofOfFunds", maxCount: 1 },
    { name: "companyRegCert", maxCount: 1 },
    { name: "passportCopy", maxCount: 1 },
    { name: "companyProfile", maxCount: 1 },
  ]),
  createBulkManufacturingRequest,
);

export default router;