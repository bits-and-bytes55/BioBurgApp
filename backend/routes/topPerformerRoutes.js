import express from "express";
import {
  getPerformers,
  createPerformer,
  updatePerformer,
  deletePerformer
} from "../controllers/topPerformerController.js";

const router = express.Router();

router.get("/", getPerformers);
router.post("/", createPerformer);
router.put("/:id", updatePerformer);
router.delete("/:id", deletePerformer);

export default router;