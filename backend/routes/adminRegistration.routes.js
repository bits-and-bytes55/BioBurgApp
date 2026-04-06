import express from "express";
import {
  getRegistrations,
  updateRegistrationStatus,
} from "../controllers/adminRegistration.controller.js";

import { adminProtect } from "../middleware/adminAuth.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

router.get(
  "/admin/registrations/:type",
  adminProtect,
  isAdmin,
  getRegistrations
);

router.put(
  "/admin/registrations/:type/:id/status",
  adminProtect,
  isAdmin,
  updateRegistrationStatus
);

export default router;
