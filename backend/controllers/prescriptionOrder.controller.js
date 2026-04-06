import { v2 as cloudinary } from "cloudinary";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendOrderStatusEmail } from "../utils/emailService.js";

/**
 * POST /api/user/upload-prescription
 * Uploads prescription to Cloudinary and creates a PRESCRIPTION-type order.
 * Env needed: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export const uploadPrescriptionOrder = async (req, res) => {
  try {
    const { fileBase64, productId, productName, price, quantity, address } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ success: false, message: "Prescription file is required" });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }

    // ── 1. Parse base64 ──────────────────────────────────────────────────────
    const match = fileBase64.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid file format. Send base64 string." });
    }
    const mimeType = match[1];
    const base64Data = match[2];
    const fileBuffer = Buffer.from(base64Data, "base64");
    const resourceType = mimeType.startsWith("image/") ? "image" : "raw";

    // ── 2. Upload to Cloudinary ──────────────────────────────────────────────
    const uploadedFile = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "bioburg/prescriptions", resource_type: resourceType },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        )
        .end(fileBuffer);
    });

    // ── 3. Build items + total ───────────────────────────────────────────────
    const items = productId
      ? [{ productId, quantity: quantity || 1, price: price || 0 }]
      : [];
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

    // ── 4. Create Order ──────────────────────────────────────────────────────
    const order = await Order.create({
      userId: req.user._id,
      orderType: "PRESCRIPTION",
      items,
      totalAmount,
      prescription: {
        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
      },
      address,
      orderStatus: "PRESCRIPTION_UPLOADED",
      trackingHistory: [{ status: "PRESCRIPTION_UPLOADED", time: new Date() }],
    });

    // ── 5. Send confirmation email ───────────────────────────────────────────
    try {
      const user = await User.findById(req.user._id).select("email name username");
      await sendOrderStatusEmail({
        toEmail: user.email,
        userName: user.name || user.username || "Customer",
        orderId: order._id,
        status: "PRESCRIPTION_UPLOADED",
      });
    } catch (emailErr) {
      console.error("Email send failed (non-critical):", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Prescription uploaded. Our pharmacist will review it shortly.",
      order,
    });
  } catch (error) {
    console.error("PRESCRIPTION UPLOAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Upload failed" });
  }
};