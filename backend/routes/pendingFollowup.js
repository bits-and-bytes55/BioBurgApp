import express from "express";
import {
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} from "../controllers/pendingFollowUp.js";

const router = express.Router();

router.get("/", getFollowUps);
router.post("/", createFollowUp);
router.put("/:id", updateFollowUp);
router.delete("/:id", deleteFollowUp);

export default router;