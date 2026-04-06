// models/Question.js
import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  question: { type: String, required: true, trim: true },
  answer: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'answered', 'deleted'],
    default: 'pending'
  },
  answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin/seller id
  answeredAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Question', QuestionSchema);
