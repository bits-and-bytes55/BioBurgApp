import express from "express";
import {
  addLabTest,
  getMyLabTests,
  deleteLabTest,
} from "../../controllers/pathology/testController.js";
import { authMiddleware } from "../../middleware/pathology/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addLabTest);
router.get("/my-tests", authMiddleware, getMyLabTests);
router.delete("/:id", authMiddleware, deleteLabTest);

export default router;
