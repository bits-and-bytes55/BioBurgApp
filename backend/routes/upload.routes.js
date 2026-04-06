import express from "express";
import { uploadBase64Image,uploadBase64Video } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/image", uploadBase64Image); 
router.post("/", uploadBase64Image);       
router.post("/video", uploadBase64Video); 

export default router;