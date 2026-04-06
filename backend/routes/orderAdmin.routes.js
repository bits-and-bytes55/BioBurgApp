import express from "express";
import { updateOrderStatus,assignZoneToOrder,getAllAdminOrders,getOrderTracking } from "../controllers/orderAdmin.controller.js";
import { adminProtect } from "../middleware/adminAuth.js"

const router = express.Router();

// 🔒 assume admin middleware already exists
router.get("/", adminProtect, getAllAdminOrders);
router.put("/update-status", adminProtect, updateOrderStatus);
router.put(
  "/:orderId/assign-zone",
  adminProtect,
  assignZoneToOrder
);
// routes/adminOrderRoutes.js
router.get(
  "/:id/tracking",
  adminProtect,
  getOrderTracking
);


export default router;

