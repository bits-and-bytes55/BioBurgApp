// middleware/testimonialUpload.js
import multer from "multer";
import pkg from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; 

// FINAL FIX: Handles the import whether Node sees it as an object or class
const CloudinaryStorage = pkg.CloudinaryStorage || pkg;

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Optional: Check if it's a video (useful if you add transformations later)
    const isVideo = file.mimetype.startsWith("video");

    return {
      folder: "testimonials",
      
      // CRITICAL: Allows Cloudinary to auto-detect Image vs Video
      resource_type: "auto", 
      
      // formats allowed
      allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"],

      // Best Practice: Don't apply image transformations (like crop/width) to videos
      // This prevents errors if you decide to add image optimization later.
      transformation: isVideo ? [] : [{ quality: "auto", fetch_format: "auto" }]
    };
  },
});

export const testimonialUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
});
