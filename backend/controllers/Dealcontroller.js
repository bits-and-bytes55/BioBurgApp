import DealOfDay from "../models/DealOfDay.js";
import fs from "fs";
import path from "path";

// Helper function to get __dirname in ES modules
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new Deal of the Day
export const addDealOfDay = async (req, res) => {
  try {
    const { productName } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Image upload zaroori hai" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;

    const newDeal = new DealOfDay({
      productName,
      imageUrl,
    });

    await newDeal.save();
    res.status(201).json({ message: "Deal of the Day safaltapoorvak add ho gayi" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all Deals of the Day
export const getAllDealsOfDay = async (req, res) => {
  try {
    const deals = await DealOfDay.find({});
    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a Deal of the Day
export const deleteDealOfDay = async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await DealOfDay.findById(id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    // Image file delete karein
    if (deal.imageUrl) {
      const imagePath = path.join(
        __dirname,
        "..",
        "uploads",
        path.basename(deal.imageUrl)
      );
      // Check if file exists before deleting
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await DealOfDay.findByIdAndDelete(id);
    res.status(200).json({ message: "Deal safaltapoorvak delete ho gayi" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};