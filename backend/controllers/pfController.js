import ProductFeedback from "../models/productFeedback.js";

export const createProductFeedback = async (req, res) => {
  try {
    const {
      customer,
      products,
      overallRating,
      remarks,
      submittedAt,
    } = req.body;

    // Validation
    if (!customer?.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product rating is required",
      });
    }

    // Create feedback
    const feedback = await ProductFeedback.create({
      customer: {
        name: customer.name || "",
        phone: customer.phone || "",
        role: customer.role || "",
        area: customer.area || "",
        placeName: customer.placeName || "",
        isExisting: !!customer.isExisting,
      },

      products,

      // overall experience rating
      overallRating:
        typeof overallRating === "number"
          ? overallRating
          : 0,

      remarks: remarks || "",

      submittedAt: submittedAt || new Date(),

      submittedBy: req.user?.id || null,
    });

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


export const getAllProductFeedbacks = async (req, res) => {
  try {
    const feedbacks = await ProductFeedback.find()
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 });

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