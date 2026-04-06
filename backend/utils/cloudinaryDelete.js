import cloudinary from "../config/cloudinary.js";

export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log("Deleted from Cloudinary:", publicId);

  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};