import express from "express";
import {
  createBulkManufacturingProduct,
  createBulkManufacturingRequirement,
  deleteBulkManufacturingProduct,
  deleteBulkManufacturingRequirement,
  getBulkManufacturingDashboard,
  getBulkManufacturingDocuments,
  getBulkManufacturingOrderById,
  getBulkManufacturingOrders,
  getBulkManufacturingProfile,
  getBulkManufacturingProductById,
  getBulkManufacturingProducts,
  getBulkManufacturingRequirements,
  searchBulkManufacturingProducts,
  updateBulkManufacturingOrderStatus,
  updateBulkManufacturingProduct,
  updateBulkManufacturingProfile,
  updateBulkManufacturingRequirement,
} from "../controllers/bulkManufacturingPortalController.js";
import bulkManufacturingAuth from "../middleware/bulkManufacturingAuth.js";

const router = express.Router();

router.use(bulkManufacturingAuth);

router.get("/dashboard", getBulkManufacturingDashboard);
router.get("/profile", getBulkManufacturingProfile);
router.put("/profile", updateBulkManufacturingProfile);
router.get("/documents", getBulkManufacturingDocuments);
router.get("/orders", getBulkManufacturingOrders);
router.get("/orders/:id", getBulkManufacturingOrderById);
router.patch("/orders/:id/status", updateBulkManufacturingOrderStatus);
router.get("/products/search", searchBulkManufacturingProducts);
router.get("/products", getBulkManufacturingProducts);
router.get("/products/:id", getBulkManufacturingProductById);
router.post("/products", createBulkManufacturingProduct);
router.put("/products/:id", updateBulkManufacturingProduct);
router.delete("/products/:id", deleteBulkManufacturingProduct);
router.get("/requirements", getBulkManufacturingRequirements);
router.post("/requirements", createBulkManufacturingRequirement);
router.put("/requirements/:id", updateBulkManufacturingRequirement);
router.delete("/requirements/:id", deleteBulkManufacturingRequirement);

export default router;
