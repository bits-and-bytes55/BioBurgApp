// routes/vendor/vendorOrders.routes.js
import express from "express";
import {
  getVendorOrders,
  getVendorOrderById,
  updateVendorOrderStatus,
  getVendorPurchases,
  placeVendorOrder,
} from "../../controllers/vendor/vendorOrders.controller.js";
import { protect } from "../../middleware/athMiddleware.js";

const router = express.Router();

router.get("/orders",                       protect(["vendor"]), getVendorOrders);
router.get("/orders/purchases",             protect(["vendor"]), getVendorPurchases);
router.post("/orders/place",                protect(["vendor"]), placeVendorOrder);
router.get("/orders/:id",                   protect(["vendor"]), getVendorOrderById);
router.patch("/orders/:id/status",          protect(["vendor"]), updateVendorOrderStatus);

export default router;