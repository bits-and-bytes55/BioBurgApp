import express from "express";
import {
  getWallet,
  addWalletCredit,
  withdrawWallet,
} from "../../controllers/Doctors/walletController.js";
import protectDoctor from "../../middleware/Doctors/doctorauthMiddleware.js";

const router = express.Router();
router.get("/", protectDoctor, getWallet);
router.post("/credit", protectDoctor, addWalletCredit);
router.post("/withdraw", protectDoctor, withdrawWallet);

export default router;

