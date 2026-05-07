import express from "express";

import {
  createProductFeedback,
  getAllProductFeedbacks,
} from "../controllers/pfController.js";

const router = express.Router();


// PUBLIC SUBMIT
router.post("/product-feedback", createProductFeedback);


// OPTIONAL ADMIN FETCH
router.get("/product-feedback", getAllProductFeedbacks);

export default router;