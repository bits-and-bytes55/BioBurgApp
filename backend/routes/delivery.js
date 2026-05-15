import express from "express";
import {
  register,
  login,
  getMe,
  getMyOrders,
  updateMyOrderStatus,
  toggleOnlineStatus,
  updateLocation,
  getMyEarningsDetail,
  getMyIdCard,
  getMyIdCardCorrections,
} from "../controllers/deliveryController.js";
import { verifyAgent } from "../middleware/DeliveryAgentAuthMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", verifyAgent, getMe);
router.get("/my-orders", verifyAgent, getMyOrders);
router.patch("/my-orders/:id/status", verifyAgent, updateMyOrderStatus);
router.patch("/toggle-online", verifyAgent, toggleOnlineStatus);
router.patch("/location", verifyAgent, updateLocation);
router.get("/my-earnings-detail", verifyAgent, getMyEarningsDetail);
router.get("/my-id-card", verifyAgent, getMyIdCard); 
router.get("/my-id-card/corrections",verifyAgent, getMyIdCardCorrections); 

export default router;