import HomeSlider from "../models/HomeSlider.js";
import cloudinary from "../config/cloudinary.js";

/* 🔹 ADD SLIDER (Cloudinary) */
export const addSlider = async (req, res) => {
  try {
    const { image, title, desc } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image required" });
    }

    // Upload to cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "home-sliders",
    });

    const slider = await HomeSlider.create({
      image: uploadRes.secure_url,
      public_id: uploadRes.public_id,
      title,
      desc,
    });

    res.json(slider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 🔹 GET ACTIVE SLIDERS (Frontend) */
export const getSliders = async (req, res) => {
  const sliders = await HomeSlider.find({ isActive: true });
  res.json(sliders);
};

/* 🔹 GET ALL (Admin) */
export const getAllSliders = async (req, res) => {
  const sliders = await HomeSlider.find().sort({ createdAt: -1 });
  res.json(sliders);
};

/* 🔹 DELETE SLIDER (Cloudinary + DB) */
export const deleteSlider = async (req, res) => {
  try {
    const slider = await HomeSlider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    // delete from cloudinary
    await cloudinary.uploader.destroy(slider.public_id);

    // delete from DB
    await slider.deleteOne();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 🔹 TOGGLE ACTIVE/INACTIVE (Admin) */
export const toggleSlider = async (req, res) => {
  try {
    const slider = await HomeSlider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    slider.isActive = !slider.isActive;
    await slider.save();

    res.json({ success: true, slider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 🔹 UPDATE DIMENSIONS & FIT (Admin) */
export const updateDimensions = async (req, res) => {
  try {
    const { width, height, objectFit } = req.body;

    const slider = await HomeSlider.findByIdAndUpdate(
      req.params.id,
      { $set: { width, height, objectFit } },
      { new: true }
    );

    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    res.json({ success: true, slider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 🔹 CROP & REPLACE IMAGE (Cloudinary) */
export const cropSlider = async (req, res) => {
  try {
    const { image } = req.body; // base64 cropped image

    if (!image) {
      return res.status(400).json({ message: "Image required" });
    }

    const slider = await HomeSlider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    // Delete old image from cloudinary
    await cloudinary.uploader.destroy(slider.public_id);

    // Upload new cropped image
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "home-sliders",
    });

    slider.image     = uploadRes.secure_url;
    slider.public_id = uploadRes.public_id;
    await slider.save();

    res.json({ success: true, slider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};