import express from "express";
import {
  createSaleOrder,
  getAgentOrders,
  getSaleOrderById,
  recordPayment,
  voidOrder,
  getPaymentHistory,
  getBioburgPayments,
  createBioburgPayment,
} from "../controllers/Saleordercontroller.js";
import { protectAgent } from "../middleware/authMiddleware.js";

const router = express.Router();

/*  Agent routes (protected)  */
router.use("/agent", protectAgent);

router.post  ("/agent/create",            createSaleOrder);
router.get   ("/agent/list",              getAgentOrders);
router.get   ("/agent/payments/history",  getPaymentHistory);
router.get   ("/agent/bioburg-payments",  getBioburgPayments);
router.get   ("/agent/:id",               getSaleOrderById);
router.patch ("/agent/:id/payment",       recordPayment);
router.patch ("/agent/:id/void",          voidOrder);

/*  Admin routes (add your own admin auth middleware)  */
router.post("/admin/bioburg-payments", createBioburgPayment);

export default router;