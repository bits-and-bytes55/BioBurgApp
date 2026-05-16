// routes/agentSaleRoutes.js
import express from "express";
import {
  createParty,
  getAgentProducts,
  getAgentParties,
  createSaleBill
} from "../controllers/saleBillController.js";

import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/create-party", protectAgent, requireAgentPermission("orders"), createParty);
router.get("/products", protectAgent, requireAgentPermission("products"), getAgentProducts);
router.get("/parties", protectAgent, requireAgentPermission("orders"), getAgentParties);
router.post("/sale-bill", protectAgent, requireAgentPermission("orders"), createSaleBill);


export default router;
