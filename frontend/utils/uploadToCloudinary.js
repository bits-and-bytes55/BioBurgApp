import { compressImage } from "./mediaCompressor";

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const compressIfImage = async (file) => {
  if (!file) return file;

  if (file.type.startsWith("image/") && file.type !== "image/gif") {
    try {
      const compressed = await compressImage(file, {
        maxWidthOrHeight: 1280,   
        quality: 0.75,            
        outputFormat: "image/jpeg",
      });
      console.info(
        `[uploadToCloudinary] Compressed: ${file.name} | ` +
        `${(file.size / 1024).toFixed(0)} KB → ${(compressed.size / 1024).toFixed(0)} KB`
      );
      return compressed;
    } catch (err) {
      console.warn("[uploadToCloudinary] Compression failed, using original:", err.message);
      return file;
    }
  }

  return file; 
};

export const uploadToCloudinary = async (file, folder = "bioburg/delivery-agents") => {
  if (!file) return null;

  const fileToUpload = await compressIfImage(file);

  const formData = new FormData();
  formData.append("file",          fileToUpload);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder",        folder);

  const resourceType =
    file.type === "application/pdf"    ? "raw"   :
    file.type.startsWith("video/")     ? "video" :
    "image";

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();
  return data.secure_url; 
};

export const uploadAllDocuments = async (filesObj, folder = "bioburg/delivery-agents") => {
  const entries = Object.entries(filesObj).filter(([, f]) => f !== null);
  const results = {};

  await Promise.all(
    entries.map(async ([key, file]) => {
      if (!file) return;
      const url = await uploadToCloudinary(file, folder);
      results[`${key}Url`] = url; 
    })
  );

  return results;
};