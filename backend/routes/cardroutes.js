import express from "express";
import multer from "multer";
import path from "path";
import { addCard, getAllCards, deleteCard } from "../controllers/cardcontroller.js";

const router = express.Router();

// Storage setup (Same as before)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Routes (Same as before)
router.post("/add", upload.single("cardImage"), addCard);
router.get("/all", getAllCards);
router.delete("/delete/:id", deleteCard);

export default router;