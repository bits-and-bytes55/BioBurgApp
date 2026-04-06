import AdBanner from "../models/BannerModel.js";

// Controller update kar diya hai, ab ye productName nahi lega
export const addAdBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image upload zaroori hai" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;

    const newAdBanner = new AdBanner({
      imageUrl,
    });

    await newAdBanner.save();
    res.status(201).json({ message: "Naya Ad Banner add ho gaya" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Ye function waise hi rahega
export const getAllAdBanners = async (req, res) => {
  try {
    const banners = await AdBanner.find({});
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};