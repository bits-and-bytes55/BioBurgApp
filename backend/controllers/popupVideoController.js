// controllers/popupVideoController.js
import PopupVideoConfig from "../models/PopupVideoConfig.js";
import { v2 as cloudinary } from "cloudinary";

const MAX_VIDEO_MB = 20;

export const getPopupVideo = async (req, res) => {
  const doc = await PopupVideoConfig.findOne().lean();
  if (!doc) return res.json({ config: null });

  // Map flat model fields → config shape the frontend expects
  const config = {
    enabled:         doc.isActive,
    videoUrl:        doc.videoUrl,
    posterUrl:       doc.thumbnailUrl,
    title:           doc.title,
    subtitle:        doc.subtitle,
    ctaText:         doc.buttonText,
    ctaLink:         doc.buttonLink,
    showOnce:        doc.showOnce,
    showDelay:       doc.delaySeconds,
    autoPlay:        true,
    showCloseButton: true,
    closeAfter:      0,
    accentColor:     "#2563eb",
  };

  return res.json({ config });
};

export const getAllPopupVideos = async (req, res) => {
  try {
    const docs = await PopupVideoConfig.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, configs: docs });
  } catch (err) {
    console.error("getAllPopupVideos:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const savePopupVideoConfig = async (req, res) => {
  try {
    const { config } = req.body;
    if (!config || typeof config !== "object") {
      return res.status(400).json({ message: "config object is required" });
    }

    const doc = await PopupVideoConfig.findOneAndUpdate(
      {},
      { config },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, config: doc.config });
  } catch (err) {
    console.error("savePopupVideoConfig:", err);
    return res.status(500).json({ message: "Failed to save config" });
  }
};

export const uploadPopupVideo = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== "string") {
      return res.status(400).json({ message: "No video data received" });
    }

    // Rough size check: base64 encodes ~4/3 bytes per char
    const approxBytes = Math.ceil((data.length * 3) / 4);
    if (approxBytes > MAX_VIDEO_MB * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: `Video must be under ${MAX_VIDEO_MB} MB` });
    }

    const result = await cloudinary.uploader.upload(data, {
      folder: "popup-videos",
      resource_type: "video",
      chunk_size: 6_000_000,
    });

    return res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error("uploadPopupVideo:", err);
    return res
      .status(500)
      .json({ message: err?.message || "Video upload failed" });
  }
};

export const uploadPopupPoster = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== "string") {
      return res.status(400).json({ message: "No image data received" });
    }

    const result = await cloudinary.uploader.upload(data, {
      folder: "popup-thumbnails",
      resource_type: "image",
    });

    return res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error("uploadPopupPoster:", err);
    return res
      .status(500)
      .json({ message: err?.message || "Poster upload failed" });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { publicId, resourceType = "image" } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: "publicId is required" });
    }
    if (!["video", "image"].includes(resourceType)) {
      return res.status(400).json({ message: "resourceType must be 'video' or 'image'" });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(500).json({ message: "Cloudinary delete failed", result });
    }

    return res.json({ success: true, result: result.result });
  } catch (err) {
    console.error("deleteMedia:", err);
    return res
      .status(500)
      .json({ message: err?.message || "Delete failed" });
  }
};

export const togglePopupActive = async (req, res) => {
  try {
    const doc     = await PopupVideoConfig.findOne().lean();
    const current = doc?.config ?? {};
    const updated = await PopupVideoConfig.findOneAndUpdate(
      {},
      { config: { ...current, enabled: !current.enabled } },
      { upsert: true, new: true }
    );
    return res.json({ success: true, enabled: updated.config.enabled });
  } catch (err) {
    console.error("togglePopupActive:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createPopupVideo = savePopupVideoConfig;
export const updatePopupVideo = savePopupVideoConfig;