import express from "express";
import { createProductFeedback, getAllProductFeedbacks } from "../controllers/pfController.js";
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/product-feedback", protectAgent, requireAgentPermission("productFeedback"), createProductFeedback);
router.get("/product-feedback",  protectAgent, requireAgentPermission("productFeedback"), getAllProductFeedbacks);


export default router;