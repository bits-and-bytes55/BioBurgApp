import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  uploadPrescriptionOrder,
  deletePrescription,
  adminApprovePrescription,
  adminRejectPrescription,
  getAllOrdersAdmin,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  replaceOrder,
  assignDeliveryAgent,
  updateDeliveryStatus,
  updateOrderPayout,          
  backfillOrderSnapshots, 
} from "../controllers/order.controller.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { adminProtect } from "../middleware/adminAuth.js";
const router = express.Router();

/* ── Admin routes ───────────────────────────────── */
router.get  ("/admin/all",              adminProtect, getAllOrdersAdmin);
router.patch("/:id/status",             adminProtect, updateOrderStatus);
router.patch("/:id/assign-agent",       adminProtect, assignDeliveryAgent);
router.patch("/:id/payout",             adminProtect, updateOrderPayout);   

router.put  ("/:orderId/approve",       adminProtect, adminApprovePrescription);
router.put  ("/:orderId/reject",        adminProtect, adminRejectPrescription);

router.get  ("/admin/backfill-snapshots", adminProtect, backfillOrderSnapshots);

/* ── User routes ────────────────────────────────── */
router.post("/place", optionalAuth, placeOrder);
router.get   ("/my-orders",             protect, getMyOrders);

// Must be before /:orderId to prevent Express matching words as IDs
router.patch ("/:id/cancel",            protect, cancelOrder);
router.patch ("/:id/return",            protect, returnOrder);
router.patch ("/:id/replace",           protect, replaceOrder);

// Agent updates delivery status on a D2C order 
router.patch ("/:id/delivery-status",   protect, updateDeliveryStatus);

router.post  ("/upload-prescription",   protect, uploadPrescriptionOrder);
router.delete("/:orderId/prescription", protect, deletePrescription);
router.get   ("/:orderId",              protect, getOrderById);

export default router;