import express from "express";
import {
  submitFranchiseForm,
  getAllFranchises,
  getFranchiseDashboard,
  getFranchiseOrders,
  getFranchiseOrderDetails,
  updateFranchiseOrderStatus,
  franchiseSalesSummary,
  franchiseSettlementSummary,
  franchiseSalesReport,
  getFranchiseProducts,
  searchFranchiseProducts,
  getFranchiseProductById,
  createFranchiseProduct,
  updateFranchiseProduct,
  deleteFranchiseProduct,
  getFranchiseInventory,
  updateFranchiseInventorySettings,
  getFranchiseRestockRequests,
  createFranchiseRestockRequest,
} from "../controllers/franchiseController.js";
import franchiseAuth from "../middleware/franchiseAuth.js";
import { adminProtect } from "../middleware/adminAuth.js";
import { upload, withUploadFolder } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/apply",
  withUploadFolder("partner-documents/franchise"),
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "governmentId", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "businessProof", maxCount: 1 },
  ]),
  submitFranchiseForm,
);
router.get("/all", adminProtect, getAllFranchises);

router.get("/dashboard", franchiseAuth, getFranchiseDashboard);
router.get("/orders", franchiseAuth, getFranchiseOrders);
router.get("/orders/:id", franchiseAuth, getFranchiseOrderDetails);
router.put("/orders/:id/status", franchiseAuth, updateFranchiseOrderStatus);

router.get("/reports/summary", franchiseAuth, franchiseSalesSummary);
router.get("/reports/settlement-summary", franchiseAuth, franchiseSettlementSummary);
router.get("/reports/sales", franchiseAuth, franchiseSalesReport);
router.get("/products/search", franchiseAuth, searchFranchiseProducts);
router.get("/products", franchiseAuth, getFranchiseProducts);
router.get("/products/:id", franchiseAuth, getFranchiseProductById);
router.post("/products", franchiseAuth, createFranchiseProduct);
router.put("/products/:id", franchiseAuth, updateFranchiseProduct);
router.delete("/products/:id", franchiseAuth, deleteFranchiseProduct);
router.get("/inventory", franchiseAuth, getFranchiseInventory);
router.put("/inventory/:productId/settings", franchiseAuth, updateFranchiseInventorySettings);
router.get("/inventory/restock-requests", franchiseAuth, getFranchiseRestockRequests);
router.post("/inventory/restock-requests", franchiseAuth, createFranchiseRestockRequest);

export default router;
