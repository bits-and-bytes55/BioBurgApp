import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import pkg from "multer-storage-cloudinary";

const CloudinaryStorage = pkg.CloudinaryStorage || pkg;
const ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
  "mp4",
  "mov",
  "mkv",
  "webm",
];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const mimeType = String(file.mimetype || "");
    const isVideo = mimeType.startsWith("video/");
    const isImage = mimeType.startsWith("image/") && mimeType !== "image/gif";

    return {
      folder: req.uploadFolder || "products",
      resource_type: "auto",
      allowed_formats: ALLOWED_FORMATS,
      transformation: isImage
        ? [{ quality: "auto", fetch_format: "auto" }]
        : [],
    };
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } 
});

export const withUploadFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};
