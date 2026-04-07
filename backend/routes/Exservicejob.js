import express from "express";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";
import {
  upload,
  createJob,
  getAllJobs,
  getPublicJobs,
  getPublicJobById,
  updateJob,
  deleteJob,
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  updateApplicantStage,
  getAnalytics,
} from "../controllers/Exservicejob.js";

const router = express.Router();

// ── PUBLIC 
router.get("/public",     getPublicJobs);
router.get("/public/:id", getPublicJobById);
router.post("/apply",     upload.single("resume"), submitApplication);

// ── ADMIN: Analytics 
router.get("/analytics", protect, adminMiddleware, getAnalytics);

// ── ADMIN: Applications 
router.get("/applications",              protect, adminMiddleware, getAllApplications);
router.get("/applications/:id",          protect, adminMiddleware, getApplicationById);
router.put("/applications/:id",          protect, adminMiddleware, updateApplicationStatus);
router.patch("/applications/:id/stage",  protect, adminMiddleware, updateApplicantStage); 
router.delete("/applications/:id",       protect, adminMiddleware, deleteApplication);

// ── ADMIN: Jobs CRUD
router.get("/",       protect, adminMiddleware, getAllJobs);
router.post("/",      protect, adminMiddleware, createJob);
router.put("/:id",    protect, adminMiddleware, updateJob);
router.delete("/:id", protect, adminMiddleware, deleteJob);

export default router;