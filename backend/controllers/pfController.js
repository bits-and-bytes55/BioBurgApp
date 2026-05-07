import ProductFeedback from "../models/productFeedback.js";


// CREATE FEEDBACK
export const createProductFeedback = async (req, res) => {
  try {
    const feedback = await ProductFeedback.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Create feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};


// GET ALL FEEDBACKS (OPTIONAL ADMIN API)
export const getAllProductFeedbacks = async (req, res) => {
  try {
    const feedbacks = await ProductFeedback.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Fetch feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedbacks",
    });
  }
};