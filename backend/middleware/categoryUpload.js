// middleware/categoryUpload.js
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import pkg from "multer-storage-cloudinary";

// Safe destructuring
const CloudinaryStorage = pkg.CloudinaryStorage || pkg;

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "categories",
    resource_type: "auto",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  }),
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed"), false);
  } else {
    cb(null, true);
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const upload = (req, res, next) => {
  multerUpload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Multer Upload Error:", err.message);

      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed",
      });
    }

    next();
  });
};
