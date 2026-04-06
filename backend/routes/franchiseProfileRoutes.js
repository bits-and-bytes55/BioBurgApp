import express from "express";
import franchiseAuth from "../middleware/franchiseAuth.js";
import {
  getFranchiseProfile,
  updateFranchiseProfile,
  changeFranchisePassword
} from "../controllers/franchiseProfileController.js";

const router = express.Router();

router.get("/profile", franchiseAuth, getFranchiseProfile);
router.put("/profile", franchiseAuth, updateFranchiseProfile);
router.put("/profile/password", franchiseAuth, changeFranchisePassword);

export default router;
