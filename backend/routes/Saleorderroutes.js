import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderAdmin,
  deleteOrderAdmin,
  getAgentOrderSummary
} from "../controllers/Saleordercontroller.js";

import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

/* ── AGENT ── /api/sale-orders/agent/... ── */
router.post("/agent/create",       protectAgent, createOrder);
router.get("/agent/my-orders",     protectAgent, getMyOrders);
router.get("/agent/:id",           protectAgent, getMyOrderById);

/* ── ADMIN ── /api/sale-orders/admin/... ── */
router.get("/admin/all",           getAllOrders);
router.get("/admin/agent-summary", getAgentOrderSummary);
router.get("/admin/:id",           getOrderByIdAdmin);
router.patch("/admin/:id",         updateOrderAdmin);
router.delete("/admin/:id",        deleteOrderAdmin);

export default router;