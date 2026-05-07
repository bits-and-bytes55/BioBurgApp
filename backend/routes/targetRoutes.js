import express from "express";
import {
  getTargets,
  createTarget,
  updateTarget,
  deleteTarget,
  getOptions,
  addOption,
} from "../controllers/targetController.js";

const router = express.Router();

router.get("/options/all", getOptions);
router.post("/options/:key", addOption);

router.get("/", getTargets);
router.post("/", createTarget);
router.put("/:id", updateTarget);
router.delete("/:id", deleteTarget);

export default router;