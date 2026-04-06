import express from "express";
import { createBulkManufacturingRequest } from "../controllers/bulkManufacturingController.js";
import { upload, withUploadFolder } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/",
  withUploadFolder("partner-documents/bulk-manufacturing"),
  upload.fields([
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
