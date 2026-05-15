import express from "express";
import {
  registerDeliveryAgent,
  loginDeliveryAgent,
  getDeliveryAgentProfile,
} from "../controllers/deliveryAgentController.js";
import { verifyAgent } from "../middleware/DeliveryAgentAuthMiddleware.js";

const router = express.Router();

/*  AUTH  */
router.post("/register", registerDeliveryAgent);
router.post("/login", loginDeliveryAgent);

/*  PROTECTED  */

router.get("/profile", verifyAgent, getDeliveryAgentProfile);

/*  DASHBOARD (TEST)  */
/* Frontend already expects this */

router.get("/dashboard", verifyAgent, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Delivery Agent dashboard access granted",
    agent: req.user,
  });
});

export default router;
