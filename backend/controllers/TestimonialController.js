import Testimonial from '../models/TestimonialModel.js';

// --- Add new testimonial ---
export const addTestimonial = async (req, res) => {
  try {
    const { review, author } = req.body;

    if (!review || !author) {
      return res.status(400).json({ message: "Review and Author are required." });
    }

    const newTestimonial = new Testimonial({
      review,
      author,
    });

    await newTestimonial.save();
    res.status(201).json({ message: 'Testimonial added successfully!' });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- Get all testimonials ---
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};