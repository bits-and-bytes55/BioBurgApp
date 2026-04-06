import express from "express";
import {
  addAdBanner,
  getAllAdBanners,
} from "../controllers/Bannercontroller.js";
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

// Routes (Isme koi change nahi hai)
router.post("/add", upload.single("bannerImage"), addAdBanner);
router.get("/", getAllAdBanners);

export default router;