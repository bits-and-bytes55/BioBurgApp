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
  deletePopupVideo, 
  getAllActivePopups,
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

router.delete("/delete/:id", adminProtect, deletePopupVideo);

router.patch("/toggle", adminProtect, togglePopupActive);

router.post(  "/create",       adminProtect, createPopupVideo);
router.put(   "/update/:id",   adminProtect, updatePopupVideo);
router.delete("/delete/:id",   adminProtect, deleteMedia); 
router.get("/active-all", optionalAuth, getAllActivePopups);

export default router;