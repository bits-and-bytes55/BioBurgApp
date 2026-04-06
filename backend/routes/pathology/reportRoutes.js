import express from "express";
import {
  uploadReport,
  getMyReports,
} from "../../controllers/pathology/reportController.js";
import { authMiddleware } from "../../middleware/pathology/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, uploadReport);
router.get("/my-reports", authMiddleware, getMyReports);

export default router;
