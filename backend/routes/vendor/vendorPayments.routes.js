// routes/vendor/vendorPayments.routes.js
import express from "express";
import { getVendorPayments } from "../../controllers/vendor/vendorPayments.controller.js";
import { protect } from "../../middleware/athMiddleware.js";

const router = express.Router();

router.get("/payments", protect(["vendor"]), getVendorPayments);

export default router;