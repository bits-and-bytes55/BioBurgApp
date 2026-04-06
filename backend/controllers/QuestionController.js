// controllers/questionController.js

import Question from '../models/Question.js';
// import Product from '../models/Product';
import mongoose from 'mongoose';    

/**
 * POST /api/questions/add
 * body: { productId, question }
 * auth: required
 */
export const addQuestion = async (req, res) => {
  try {
    const { productId, question } = req.body;
    if (!productId || !question) {
      return res.status(400).json({ success: false, message: 'productId and question required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid productId' });
    }
    // optional: check product exists
    // const product = await Product.findById(productId);
    // if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const newQ = await Question.create({
      userId: req.user._id,
      productId,
      question,
    });

    return res.status(201).json({ success: true, data: newQ });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/questions/user/:userId
 * auth: required (user can fetch only own or admin can fetch any)
 */
export const getUserQuestions = async (req, res) => {
  try {
    const { userId } = req.params;
    // security: non-admin can fetch only their own userId
    if (!req.user.isAdmin && req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const q = await Question.find({ userId })
      .populate('productId', 'title images') // show product title/image
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: q });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/questions/product/:productId
 * public: allowed (to display under product page)
 * optional pagination
 */
export const getProductQuestions = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, page) - 1) * limit;

    const q = await Question.find({ productId, status: { $ne: 'deleted' } })
      .populate('userId', 'name') // show asker's name
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({ success: true, data: q });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/questions/reply/:questionId
 * body: { answer }
 * auth: admin/seller required
 */
export const replyToQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ success: false, message: 'Answer required' });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    question.answer = answer;
    question.status = 'answered';
    question.answeredBy = req.admin._id;
    question.answeredAt = new Date();

    await question.save();

    // TODO: send notification/email to question.userId
    // e.g., queue email or push notification

    return res.json({ success: true, data: question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /api/questions/:questionId
 * soft delete: set status = deleted
 * auth: owner or admin
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const q = await Question.findById(questionId);

    if (!q)
      return res.status(404).json({ success: false, message: "Question not found" });

    // ----------------------------------------
    // Identify if request is from user or admin
    // ----------------------------------------
    const isAdmin = req.admin ? true : false;   // adminProtect
    const userId = req.user ? req.user._id.toString() : null;

    // ----------------------------------------
    // Admin can delete any question
    // User can delete only OWN question
    // ----------------------------------------
    if (!isAdmin && q.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    q.status = "deleted";
    await q.save();

    return res.json({ success: true, message: "Question deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



