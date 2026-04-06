import express from "express";
import {
  forgotFranchisePassword,
  franchiseLogin,
  resetFranchisePassword,
} from "../controllers/franchiseAccountController.js";

const router = express.Router();
router.post("/login", franchiseLogin);
router.post("/forgot-password", forgotFranchisePassword);
router.post("/reset-password", resetFranchisePassword);

export default router;
