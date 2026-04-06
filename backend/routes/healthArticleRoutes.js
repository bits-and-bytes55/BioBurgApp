import express from "express";
import {
  addHealthArticle,
  getAllHealthArticles,
} from "../controllers/HealthArticlecontroller.js";
import multer from "multer";

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Routes
// 'articleImage' naam form field se match hona chahiye
router.post("/add", upload.single("articleImage"), addHealthArticle);
router.get("/", getAllHealthArticles);

export default router;