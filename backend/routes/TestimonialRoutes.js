import express from 'express';
import { addTestimonial, getAllTestimonials } from '../controllers/TestimonialController.js';

const router = express.Router();

// POST /api/testimonials/add
router.post('/add', addTestimonial);

// GET /api/testimonials
router.get('/', getAllTestimonials);

export default router;