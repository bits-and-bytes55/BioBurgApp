import express from "express";
import {
  createJob,
  getAllJobs,
  updateJob,
  deleteJob,
  getPublicJobs,
  getPublicJobById,
} from "../controllers/jobManage.js";

import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

//PUBLIC routes
router.get("/public", getPublicJobs);          
router.get("/public/:id", getPublicJobById);   

//ADMIN routes
router.post("/", protect, adminMiddleware, createJob);
router.get("/", protect, adminMiddleware, getAllJobs);
router.put("/:id", protect, adminMiddleware, updateJob);
router.delete("/:id", protect, adminMiddleware, deleteJob);

export default router;