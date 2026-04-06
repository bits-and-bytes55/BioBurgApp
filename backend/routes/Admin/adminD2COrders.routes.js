import express from "express";
import {
  getAllD2COrders,
  getD2COrderById,
  getD2COrderStats,
  updateD2COrderStatus,
} from "../../controllers/adminD2COrders.controller.js";

const router = express.Router();

// GET /api/admin/orders/d2c/stats
router.get("/d2c/stats", getD2COrderStats);

// GET /api/admin/orders/d2c
router.get("/d2c", getAllD2COrders);

// GET /api/admin/orders/d2c/:id
router.get("/d2c/:id", getD2COrderById);

// PUT /api/admin/orders/d2c/:id/status  ← NEW: status update endpoint
router.put("/d2c/:id/status", updateD2COrderStatus);

export default router;