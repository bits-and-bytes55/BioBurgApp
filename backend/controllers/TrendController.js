import TrendingProduct from '../models/TrendModel.js';
import mongoose from 'mongoose'; // 🆕 Import
import fs from 'fs';       // 🆕 Import
import path from 'path';     // 🆕 Import

// POST /api/trends/add
export const addTrending = async (req, res) => {
  try {
    const { productName, mrp, price } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image upload zaroori hai' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const newTrending = new TrendingProduct({
      productName,
      mrp,
      price,
      imageUrl,
    });

    await newTrending.save();
    
    // 🟡 Frontend state update ke liye poora object wapas bhejein
    res.status(201).json({ 
      message: 'Naya trending product add ho gaya',
      trend: newTrending // 🆕 Naya object bhej rahe hain
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/trends
export const getAllTrending = async (req, res) => {
  try {
    // 🟡 Naye waale pehle dikhane ke liye sort karein
    const trending = await TrendingProduct.find({}).sort({ createdAt: -1 });
    res.status(200).json(trending);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// 🆕 DELETE /api/trends/delete/:id
export const deleteTrending = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. ID check
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Product ID.' });
    }

    // 2. DB se delete
    const deletedTrend = await TrendingProduct.findByIdAndDelete(id);

    if (!deletedTrend) {
      return res.status(404).json({ message: 'Trending product not found.' });
    }

    // 3. 'uploads' folder se image file delete
    try {
      const imagePath = path.join(process.cwd(), deletedTrend.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (imgErr) {
      console.error("Error deleting image file:", imgErr);
    }

    res.status(200).json({ message: 'Trending product deleted successfully!' });

  } catch (error) {
    console.error("Error deleting trending product:", error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};