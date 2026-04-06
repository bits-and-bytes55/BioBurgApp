import express from "express";
import { partnerLogin } from "../../controllers/Radiology/auth.controller.js";

const router = express.Router();

router.post("/partner/login", partnerLogin);

export default router;
