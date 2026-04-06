import FeaturedBrand from '../models/BrandModel.js';

// POST /api/featured-brands/add
export const addFeaturedBrand = async (req, res) => {
  try {
    const { productName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image upload zaroori hai' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const newBrand = new FeaturedBrand({
      productName,
      imageUrl,
    });

    await newBrand.save();
    res.status(201).json({ message: 'Naya brand add ho gaya' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/featured-brands
export const getAllFeaturedBrands = async (req, res) => {
  try {
    const brands = await FeaturedBrand.find({});
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};