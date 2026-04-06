// routes/agentSaleRoutes.js
import express from "express";
import {
  createParty,
  getAgentProducts,
  getAgentParties,
  createSaleBill
} from "../controllers/saleBillController.js";

import { protectAgent } from '../middleware/marketingAgenTauthMiddleware.js'

const router = express.Router();

router.post("/create-party", protectAgent, createParty);
router.get("/products", protectAgent, getAgentProducts);
router.get("/parties", protectAgent, getAgentParties);
router.post("/sale-bill", protectAgent, createSaleBill);

export default router;
