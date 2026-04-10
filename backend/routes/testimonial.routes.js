import express from "express";
import {
  createTestimonial,
  getAllTestimonials,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonial.controller.js";

const router = express.Router();

/* CREATE TESTIMONIAL */
router.post("/create", createTestimonial);

/* GET ALL TESTIMONIALS */
router.get("/all", getAllTestimonials);

/*  UPDATE TESTIMONIAL*/
router.put("/update/:id", updateTestimonial);

/* DELETE TESTIMONIAL */
router.delete("/delete/:id", deleteTestimonial);

export default router;
