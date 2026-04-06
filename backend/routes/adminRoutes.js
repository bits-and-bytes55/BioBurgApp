import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
} from "../controllers/authcontroller.js";

import { adminProtect } from "../middleware/adminAuth.js";
import franchiseAuthRoutes from "./franchiseAuthRoutes.js";
import adminApproveRoutes from "./adminFranchiseRoutes.js";
import adminRegistrationsRoutes from "./adminRegistration.routes.js";
import adminD2COrdersRoutes from "./Admin/adminD2COrders.routes.js";
import adminUsersRoutes from "./Adminusers.routes.js";

const router = express.Router();

/* ---------------- AUTH ---------------- */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", adminProtect, getAdminProfile);

/* ---------------- NESTED ADMIN MODULES ---------------- */
router.use("/franchise",      adminProtect, franchiseAuthRoutes);
router.use("/approve",        adminProtect, adminApproveRoutes);
router.use("/registrations",  adminProtect, adminRegistrationsRoutes);
router.use("/orders",         adminProtect, adminD2COrdersRoutes);
router.use("/users",          adminProtect, adminUsersRoutes);

export default router;