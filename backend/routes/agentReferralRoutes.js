import express from "express";

import {
  createReferral,
  getAllReferrals,
  getReferralById,
  approveReferral,
  rejectReferral,
  deleteReferral,
  getAdminReferrals,
} from "../controllers/agentReferralController.js";

const router = express.Router();


// CREATE REFERRAL
router.post("/", createReferral);

// GET ALL REFERRALS
router.get("/", getAllReferrals);

// GET SINGLE REFERRAL
router.get("/:id", getReferralById);

// APPROVE REFERRAL
router.put("/:id/approve", approveReferral);

// REJECT REFERRAL
router.put("/:id/reject", rejectReferral);

// DELETE REFERRAL
router.delete("/:id", deleteReferral);

export default router;