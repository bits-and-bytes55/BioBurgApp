import cloudinary from "../config/cloudinary.js";

export const uploadBase64Image = async (req, res) => {
  try {
    const { file } = req.body;

    if (!file || !file.startsWith("data:image/")) {
      return res.status(400).json({ message: "Invalid image" });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: "bioburg_products",
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const uploadBase64Video = async (req, res) => {
  try {
    const { video, data, file } = req.body;
    const base64String = video || data || file;
 
    if (!base64String) {
      return res.status(400).json({ message: "No video data provided" });
    }
 
    // Validate it is actually a video base64 string
    const isDataUri = base64String.startsWith("data:");
    if (isDataUri && !base64String.startsWith("data:video/")) {
      return res.status(400).json({ message: "File must be a video" });
    }
 
    const result = await cloudinary.uploader.upload(base64String, {
      resource_type: "video",
      folder: "training_videos",
      // Cloudinary will auto-detect format from the base64 data URI
    });
 
    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: "video",
      duration: result.duration || null,    // seconds
      format: result.format || null,
    });
  } catch (error) {
    console.error("Video upload error:", error.message);
    res.status(500).json({ message: "Video upload failed", error: error.message });
  }
};