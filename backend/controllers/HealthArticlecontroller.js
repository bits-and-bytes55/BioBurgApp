import HealthArticle from "../models/HealthArticleModel.js";

// Naya article add karne ka logic
export const addHealthArticle = async (req, res) => {
  const { heading } = req.body; // Form se 'heading' field aayega
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image upload zaroori hai" });
    }
    if (!heading) {
      return res
        .status(400)
        .json({ message: "Article Heading zaroori hai" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const newArticle = new HealthArticle({
      heading,
      imageUrl,
    });

    await newArticle.save();
    res.status(201).json({ message: "Naya Health Article add ho gaya" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Saare articles fetch karne ka logic
export const getAllHealthArticles = async (req, res) => {
  try {
    const articles = await HealthArticle.find({});
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};