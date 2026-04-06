import express from "express";
import {
  addDealOfDay,
  getAllDealsOfDay,
  deleteDealOfDay,
} from "../controllers/Dealcontroller.js";
import multer from "multer";
import path from "path";

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

// POST /api/deals/add
router.post("/add", upload.single("dealImage"), addDealOfDay);

// GET /api/deals
router.get("/", getAllDealsOfDay);

// DELETE /api/deals/:id
router.delete("/:id", deleteDealOfDay);

export default router;