import express from "express";
import { verifyToken } from "../../controllers/pathology/authController.js";

const router = express.Router();

router.get("/verify-token", verifyToken);

export default router;
