// routes/popupVideoRoutes.js
import express from "express";
import {
  getPopupVideo,
  getAllPopupVideos,
  savePopupVideoConfig,
  uploadPopupVideo,
  uploadPopupPoster,
  deleteMedia,
  togglePopupActive,
  createPopupVideo,
  updatePopupVideo,
} from "../controllers/popupVideoController.js";
import { adminProtect } from "../middleware/adminAuth.js";
import { optionalAuth }  from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/active", optionalAuth, getPopupVideo);
router.get("/config", adminProtect, getPopupVideo);   
router.get("/all",    adminProtect, getAllPopupVideos);

router.post("/config", adminProtect, savePopupVideoConfig);

router.post("/upload",        adminProtect, uploadPopupVideo);
router.post("/upload-poster", adminProtect, uploadPopupPoster);

// Body: { publicId: string, resourceType: "video"|"image" }
router.post("/delete-media", adminProtect, deleteMedia);

router.patch("/toggle", adminProtect, togglePopupActive);

router.post(  "/create",       adminProtect, createPopupVideo);
router.put(   "/update/:id",   adminProtect, updatePopupVideo);
router.delete("/delete/:id",   adminProtect, deleteMedia); 

export default router;