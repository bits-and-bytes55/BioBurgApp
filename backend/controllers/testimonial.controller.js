import Testimonial from "../models/testimonial.model.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
/*CREATE TESTIMONIAL */
export const createTestimonial = async (req, res) => {
  try {
    const {
      description,
      clientName,
      position,
      birthDate,
      brandName,
      brandId,
      video,
      clientImage,
    } = req.body;

    if (!video?.url || !clientImage?.url) {
      return res.status(400).json({
        success: false,
        message: "Video and Client Image are required",
      });
    }

    const newData = await Testimonial.create({
      videoUrl: video.url,
      videoPublicId: video.public_id,
      clientImage: clientImage.url,
      clientImagePublicId: clientImage.public_id,
      description,
      clientName,
      position,
      birthDate,
      brandName,
      brandId,
    });

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: newData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*GET ALL TESTIMONIALS*/
export const getAllTestimonials = async (req, res) => {
  try {
    const data = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* UPDATE TESTIMONIAL*/
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      clientName,
      position,
      birthDate,
      brandName,
      brandId,
      video,
      clientImage,
    } = req.body;

    const existing = await Testimonial.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    // Video update
    if (video?.url && video?.public_id) {
      if (existing.videoPublicId) {
        await deleteFromCloudinary(existing.videoPublicId, "video");
      }
      existing.videoUrl = video.url;
      existing.videoPublicId = video.public_id;
    }

    // Client image update
    if (clientImage?.url && clientImage?.public_id) {
      if (existing.clientImagePublicId) {
        await deleteFromCloudinary(existing.clientImagePublicId, "image");
      }
      existing.clientImage = clientImage.url;
      existing.clientImagePublicId = clientImage.public_id;
    }

    // Other fields
    existing.description = description ?? existing.description;
    existing.clientName = clientName ?? existing.clientName;
    existing.position = position ?? existing.position;
    existing.birthDate = birthDate ?? existing.birthDate;
    existing.brandName = brandName ?? existing.brandName;
    existing.brandId = brandId ?? existing.brandId;

    const updated = await existing.save();

    res.status(200).json({
      success: true,
      message: "Testimonial updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*DELETE TESTIMONIAL*/
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    // delete from cloudinary
    if (testimonial.videoPublicId) {
      await deleteFromCloudinary(testimonial.videoPublicId, "video");
    }

    if (testimonial.clientImagePublicId) {
      await deleteFromCloudinary(testimonial.clientImagePublicId, "image");
    }

    await testimonial.deleteOne();

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
