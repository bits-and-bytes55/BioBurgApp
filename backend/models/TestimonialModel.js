import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, "Review text is required"],
    trim: true,
  },
  author: {
    type: String,
    required: [true, "Author name is required"],
    trim: true,
  },
}, { timestamps: true });

const Testimonial = mongoose.model('TestimonialModel', testimonialSchema);
export default Testimonial;