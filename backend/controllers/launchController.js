// 💡 Note: Aapke model file ka naam 'LaunchModel.js' hai
// lekin uske andar export 'NewLaunch' hai.
// Hum sahi export 'NewLaunch' ko import kar rahe hain.
import NewLaunch from '../models/LaunchModel.js'; 
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// --- API 1: Naya Launch Add Karna ---
export const addLaunch = async (req, res) => {
  try {
    const { productName, mrp, price } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image upload zaroori hai' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const newLaunch = new NewLaunch({
      productName,
      mrp,
      price,
      imageUrl,
    });

    await newLaunch.save();

    // 🟡 Frontend state update ke liye poora object wapas bhejein
    res.status(201).json({ 
      message: 'Naya launch product add ho gaya', 
      launch: newLaunch // 🆕 Naya object bhej rahe hain
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- API 2: Saare Launches Fetch Karna ---
export const getAllLaunches = async (req, res) => {
  try {
    // 🟡 Naye waale pehle dikhane ke liye sort karein
    const launches = await NewLaunch.find({}).sort({ createdAt: -1 }); 
    res.status(200).json(launches);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- API 3: Launch Delete Karna (Naya Function) ---
export const deleteLaunch = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. ID check
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Launch ID.' });
    }

    // 2. DB se delete
    const deletedLaunch = await NewLaunch.findByIdAndDelete(id);

    if (!deletedLaunch) {
      return res.status(404).json({ message: 'Launch product not found.' });
    }

    // 3. 'uploads' folder se image file delete
    try {
      const imagePath = path.join(process.cwd(), deletedLaunch.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (imgErr) {
      console.error("Error deleting image file:", imgErr);
    }

    res.status(200).json({ message: 'Launch deleted successfully!' });

  } catch (error) {
    console.error("Error deleting launch:", error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};