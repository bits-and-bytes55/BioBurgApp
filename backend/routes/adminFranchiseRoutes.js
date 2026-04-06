import express from "express";
import { approveFranchise } from "../controllers/adminApproveController.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();
router.post("/approve", adminProtect, approveFranchise);

export default router;