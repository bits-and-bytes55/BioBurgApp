import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);

export default router;