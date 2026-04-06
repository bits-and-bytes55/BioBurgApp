import express from "express";
import {
  getAllOrders,
  getUnassignedOrders,
  getAssignedOrders,
  assignVendorToOrder,
} from "../../../controllers/vendor/admin/adminOrders.controller.js";
import { adminProtect } from "../../../middleware/adminAuth.js";

const router = express.Router();

router.get("/", adminProtect, getAllOrders);
router.get("/unassigned", adminProtect, getUnassignedOrders);
router.get("/assigned", adminProtect, getAssignedOrders);
router.post("/assign-vendor", adminProtect, assignVendorToOrder);

export default router;
