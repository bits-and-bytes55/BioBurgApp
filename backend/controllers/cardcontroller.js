import Card from "../models/cardmodel.js";
import path from "path";
import mongoose from "mongoose";
import fs from 'fs'; // 🆕 Image delete karne ke liye

export const addCard = async (req, res) => {
  try {
    // 🟡 Sirf 'title' liya
    const { title } = req.body;

    // 🟡 Validation se mrp aur price hataya
    if (!title || !req.file) {
      return res.status(400).json({ message: "Title and image are required." });
    }

    const newCard = new Card({
      title,
      // 🟡 mrp aur price hataya
      imageUrl: `/uploads/${req.file.filename}`,
    });

    await newCard.save();
    res.status(201).json({ message: "Card added successfully!", card: newCard });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// 🟡 Fetch All Cards (Isme koi change nahi)
export const getAllCards = async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Failed to fetch cards" });
  }
};

// 🟡 Delete Card (Isme image deletion add kar diya)
export const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Card ID." });
    }

    const deletedCard = await Card.findByIdAndDelete(id);

    if (!deletedCard) {
      return res.status(404).json({ message: "Card not found." });
    }

    // 🆕 Server se image file bhi delete karein
    try {
      const imagePath = path.join(process.cwd(), deletedCard.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (imgErr) {
      console.error("Error deleting image file:", imgErr);
    }

    res.status(200).json({ message: "Card deleted successfully!" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};