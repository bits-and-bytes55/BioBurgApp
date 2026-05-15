import express from "express";
import { createProductFeedback, getAllProductFeedbacks } from "../controllers/pfController.js";
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";

const router = express.Router();

router.post("/product-feedback", protectAgent, createProductFeedback);
router.get("/product-feedback",  protectAgent, getAllProductFeedbacks);

export default router;