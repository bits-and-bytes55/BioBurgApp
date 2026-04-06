import express from "express";

import {
  addQuestion,
  getUserQuestions,
  getProductQuestions,
  replyToQuestion,
  deleteQuestion,
} from "../controllers/QuestionController.js";

import { protect} from "../middleware/authMiddleware.js";
import { adminProtect } from "../middleware/adminAuth.js"

const router = express.Router();

router.post("/add", protect, addQuestion);
router.get("/user/:userId", protect, getUserQuestions);
router.get("/product/:productId", getProductQuestions);
router.patch("/reply/:questionId", adminProtect, replyToQuestion);
router.delete("/:questionId", protect, deleteQuestion);
router.delete("/admin/:questionId", adminProtect, deleteQuestion);


export default router;
