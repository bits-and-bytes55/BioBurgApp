// controllers/adminVisualAds.controller.js
import VisualAd from "../models/VisualAd.model.js";
import cloudinary from "../config/cloudinary.js";

/* ─── helpers ─────────────────────────────────────────────── */

/**
 * Upload a base64 string to Cloudinary.
 * @param {string} base64   Raw base64 data (no data-URI prefix)
 * @param {string} mime     e.g. "image/jpeg" | "video/mp4"
 * @param {string} folder   Cloudinary folder name
 * @returns {{ secure_url, public_id }}
 */
const uploadToCloudinary = async (base64, mime, folder) => {
  const dataUri = `data:${mime};base64,${base64}`;
  const resourceType = mime.startsWith("video") ? "video" : "image";

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType,
    // For videos Cloudinary can auto-generate a thumbnail — we request it
    ...(resourceType === "video" && { eager: [{ format: "jpg", transformation: [{ width: 400 }] }] }),
  });

  return result;
};

/**
 * Safely destroy a Cloudinary asset (image or video).
 */
const destroyCloudinary = async (publicId, mime = "image") => {
  if (!publicId) return;
  const resourceType = (mime || "image").startsWith("video") ? "video" : "image";
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary destroy error:", err.message);
  }
};

/* ─── CREATE ──────────────────────────────────────────────── */
/**
 * POST /api/admin/visual-ads
 * Body (JSON):
 *  title, description?, mediaBase64, mediaMime, targetType, targetAgents[]?, tags[]?, isActive?
 *  thumbnailBase64?, thumbnailMime?   (optional override thumbnail for video)
 */
export const createVisualAd = async (req, res) => {
  try {
    const {
      title,
      description,
      mediaBase64,
      mediaMime,
      targetType,
      targetAgents,
      tags,
      isActive,
      thumbnailBase64,
      thumbnailMime,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!mediaBase64 || !mediaMime) {
      return res.status(400).json({ message: "Media file (base64 + mime) is required" });
    }

    // Determine media type
    const mediaType = mediaMime.startsWith("video") ? "video" : "image";

    // Upload main media
    const uploaded = await uploadToCloudinary(mediaBase64, mediaMime, "visual_ads");

    // Thumbnail: use Cloudinary eager result for video, or explicit upload
    let thumbnailUrl = null;
    let thumbnailPublicId = null;

    if (mediaType === "video") {
      if (uploaded.eager && uploaded.eager.length > 0) {
        thumbnailUrl = uploaded.eager[0].secure_url;
        // Cloudinary derived images share the same public_id base
      } else if (thumbnailBase64 && thumbnailMime) {
        const thumb = await uploadToCloudinary(
          thumbnailBase64,
          thumbnailMime,
          "visual_ads_thumbs"
        );
        thumbnailUrl = thumb.secure_url;
        thumbnailPublicId = thumb.public_id;
      }
    }

    const ad = await VisualAd.create({
      title: title.trim(),
      description: description?.trim() || "",
      mediaType,
      mediaUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
      thumbnailUrl,
      thumbnailPublicId,
      targetType: targetType || "all",
      targetAgents: Array.isArray(targetAgents) ? targetAgents : [],
      tags: Array.isArray(tags) ? tags : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({ success: true, ad });
  } catch (err) {
    console.error("createVisualAd error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ─── LIST ALL (admin — all ads) ──────────────────────────── */
/**
 * GET /api/admin/visual-ads
 * Query: ?page=1&limit=20&mediaType=image|video&targetType=all|specific&isActive=true|false
 */
export const getAllVisualAds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      mediaType,
      targetType,
      isActive,
      search,
    } = req.query;

    const filter = {};
    if (mediaType) filter.mediaType = mediaType;
    if (targetType) filter.targetType = targetType;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [ads, total] = await Promise.all([
      VisualAd.find(filter)
        .populate("targetAgents", "name email assignedArea")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      VisualAd.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      ads,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── GET SINGLE ──────────────────────────────────────────── */
export const getVisualAdById = async (req, res) => {
  try {
    const ad = await VisualAd.findById(req.params.id)
      .populate("targetAgents", "name email assignedArea")
      .lean();
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── UPDATE ──────────────────────────────────────────────── */
/**
 * PUT /api/admin/visual-ads/:id
 * Body: same fields as create; mediaBase64 is optional (only if replacing media)
 */
export const updateVisualAd = async (req, res) => {
  try {
    const ad = await VisualAd.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    const {
      title,
      description,
      mediaBase64,
      mediaMime,
      targetType,
      targetAgents,
      tags,
      isActive,
      thumbnailBase64,
      thumbnailMime,
    } = req.body;

    // If new media is provided — replace old
    if (mediaBase64 && mediaMime) {
      // Delete old from Cloudinary
      await destroyCloudinary(ad.publicId, ad.mediaType === "video" ? "video/mp4" : "image/jpeg");
      if (ad.thumbnailPublicId) {
        await destroyCloudinary(ad.thumbnailPublicId, "image/jpeg");
      }

      const mediaType = mediaMime.startsWith("video") ? "video" : "image";
      const uploaded = await uploadToCloudinary(mediaBase64, mediaMime, "visual_ads");

      ad.mediaType = mediaType;
      ad.mediaUrl = uploaded.secure_url;
      ad.publicId = uploaded.public_id;
      ad.thumbnailUrl = null;
      ad.thumbnailPublicId = null;

      if (mediaType === "video") {
        if (uploaded.eager && uploaded.eager.length > 0) {
          ad.thumbnailUrl = uploaded.eager[0].secure_url;
        } else if (thumbnailBase64 && thumbnailMime) {
          const thumb = await uploadToCloudinary(thumbnailBase64, thumbnailMime, "visual_ads_thumbs");
          ad.thumbnailUrl = thumb.secure_url;
          ad.thumbnailPublicId = thumb.public_id;
        }
      }
    }

    // Update scalar fields
    if (title !== undefined) ad.title = title.trim();
    if (description !== undefined) ad.description = description.trim();
    if (targetType !== undefined) ad.targetType = targetType;
    if (targetAgents !== undefined) ad.targetAgents = Array.isArray(targetAgents) ? targetAgents : [];
    if (tags !== undefined) ad.tags = Array.isArray(tags) ? tags : [];
    if (isActive !== undefined) ad.isActive = Boolean(isActive);

    await ad.save();

    const populated = await VisualAd.findById(ad._id)
      .populate("targetAgents", "name email assignedArea")
      .lean();

    res.json({ success: true, ad: populated });
  } catch (err) {
    console.error("updateVisualAd error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ─── DELETE ──────────────────────────────────────────────── */
/**
 * DELETE /api/admin/visual-ads/:id
 * Removes doc from DB and deletes media + thumbnail from Cloudinary.
 */
export const deleteVisualAd = async (req, res) => {
  try {
    const ad = await VisualAd.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // Delete main media from Cloudinary
    await destroyCloudinary(
      ad.publicId,
      ad.mediaType === "video" ? "video/mp4" : "image/jpeg"
    );

    // Delete thumbnail (if any and if it has its own public_id)
    if (ad.thumbnailPublicId) {
      await destroyCloudinary(ad.thumbnailPublicId, "image/jpeg");
    }

    await VisualAd.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Ad deleted successfully" });
  } catch (err) {
    console.error("deleteVisualAd error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ─── TOGGLE ACTIVE STATUS ────────────────────────────────── */
/**
 * PATCH /api/admin/visual-ads/:id/toggle
 */
export const toggleVisualAdStatus = async (req, res) => {
  try {
    const ad = await VisualAd.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    ad.isActive = !ad.isActive;
    await ad.save();

    res.json({ success: true, isActive: ad.isActive, message: `Ad ${ad.isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};