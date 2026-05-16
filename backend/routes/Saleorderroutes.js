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
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";


const router = express.Router();

/*  Agent routes (protected)  */
router.use("/agent", protectAgent);

router.post  ("/agent/create",            requireAgentPermission("orders"), createSaleOrder);
router.get   ("/agent/list",              requireAgentPermission("orders"), getAgentOrders);
router.get   ("/agent/payments/history",  requireAgentPermission("billing"), getPaymentHistory);
router.get   ("/agent/bioburg-payments",  requireAgentPermission("billing"), getBioburgPayments);
router.get   ("/agent/:id",               requireAgentPermission("orders"), getSaleOrderById);
router.patch ("/agent/:id/payment",       requireAgentPermission("billing"), recordPayment);
router.patch ("/agent/:id/void",          requireAgentPermission("orders"), voidOrder);

/*  Admin routes (add your own admin auth middleware)  */
router.post("/admin/bioburg-payments", createBioburgPayment);

export default router;