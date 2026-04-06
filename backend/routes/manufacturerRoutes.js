import express from "express";
import {
  changeManufacturerPassword,
  getManufacturerDashboard,
  getManufacturerProfile,
  loginManufacturer,
  registerManufacturer,
  updateManufacturerProfile,
} from "../controllers/manufacturerController.js";
import {
  createManufacturerProduct,
  deleteManufacturerProduct,
  getManufacturerOrderById,
  getManufacturerOrders,
  getManufacturerPaymentSummary,
  getManufacturerProductById,
  getManufacturerProducts,
  searchManufacturerProducts,
  updateManufacturerOrderStatus,
  updateManufacturerProduct,
} from "../controllers/manufacturerPortalController.js";
import { protectManufacturer } from "../middleware/mfgAuthMiddleware.js";
import { upload, withUploadFolder } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/register",
  withUploadFolder("partner-documents/pharma-manufacturer"),
  upload.fields([
    { name: "licenseFile" },
    { name: "gmpCertFile" },
    { name: "isoCertFile" },
    { name: "productListFile" },
    { name: "qualityTestDocs" },
  ]),
  registerManufacturer,
);

router.post("/login", loginManufacturer);
router.get("/dashboard", protectManufacturer, getManufacturerDashboard);
router.get("/profile", protectManufacturer, getManufacturerProfile);
router.put("/profile", protectManufacturer, updateManufacturerProfile);
router.post(
  "/account/change-password",
  protectManufacturer,
  changeManufacturerPassword,
);
router.get("/orders", protectManufacturer, getManufacturerOrders);
router.get("/orders/:id", protectManufacturer, getManufacturerOrderById);
router.patch(
  "/orders/:id/status",
  protectManufacturer,
  updateManufacturerOrderStatus,
);
router.get("/payments/summary", protectManufacturer, getManufacturerPaymentSummary);
router.get("/products/search", protectManufacturer, searchManufacturerProducts);
router.get("/products", protectManufacturer, getManufacturerProducts);
router.get("/products/:id", protectManufacturer, getManufacturerProductById);
router.post("/products", protectManufacturer, createManufacturerProduct);
router.put("/products/:id", protectManufacturer, updateManufacturerProduct);
router.delete("/products/:id", protectManufacturer, deleteManufacturerProduct);

export default router;
