import Gift             from "../models/gift.js";
import GiftDistribution from "../models/giftDistribution.js";
import cloudinary       from "../config/cloudinary.js";

// CATALOG 

export const getAllGifts = async (req, res) => {
  try {
    const gifts = await Gift.find().sort({ createdAt: -1 });
    res.json(gifts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getGiftStats = async (req, res) => {
  try {
    const gifts = await Gift.find();
    const myDist = await GiftDistribution.find({ agent: req.agent._id });

    const totalGifts   = gifts.length;
    const inStock      = gifts.filter(g => g.availableQuantity > 0).length;
    const lowStock     = gifts.filter(g => g.availableQuantity > 0 && g.availableQuantity <= 5).length;
    const outOfStock   = gifts.filter(g => g.availableQuantity === 0).length;
    const totalValue   = gifts.reduce((s, g) => s + g.value * g.availableQuantity, 0);
    const distributed  = myDist.reduce((s, d) => s + d.quantity, 0);

    // Category breakdown
    const byCategory = gifts.reduce((acc, g) => {
      acc[g.category] = (acc[g.category] || 0) + 1;
      return acc;
    }, {});

    res.json({ totalGifts, inStock, lowStock, outOfStock, totalValue, distributed, byCategory });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createGift = async (req, res) => {
  try {
    const { name, category, description, totalQuantity, value, imageBase64, imageMimeType } = req.body;

    let image = { url: "", public_id: "" };
    if (imageBase64) {
      const uploaded = await cloudinary.uploader.upload(
        `data:${imageMimeType};base64,${imageBase64}`,
        { folder: "gifts" }
      );
      image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const gift = await Gift.create({
      name, category, description,
      totalQuantity:     Number(totalQuantity) || 0,
      availableQuantity: Number(totalQuantity) || 0,
      value:  Number(value) || 0,
      image,
      addedBy: req.agent._id,
    });

    res.status(201).json(gift);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const updateGift = async (req, res) => {
  try {
    const { imageBase64, imageMimeType, removeImage, ...rest } = req.body;
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ message: "Gift not found" });

    // Handle image update
    if (imageBase64) {
      if (gift.image?.public_id) await cloudinary.uploader.destroy(gift.image.public_id);
      const uploaded = await cloudinary.uploader.upload(
        `data:${imageMimeType};base64,${imageBase64}`,
        { folder: "gifts" }
      );
      rest.image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    } else if (removeImage) {
      if (gift.image?.public_id) await cloudinary.uploader.destroy(gift.image.public_id);
      rest.image = { url: "", public_id: "" };
    }

    // Recalculate availableQuantity if totalQuantity changed
    if (rest.totalQuantity !== undefined) {
      const diff = Number(rest.totalQuantity) - gift.totalQuantity;
      rest.availableQuantity = Math.max(0, gift.availableQuantity + diff);
    }

    Object.assign(gift, rest);
    await gift.save();
    res.json(gift);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const deleteGift = async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);
    if (!gift) return res.status(404).json({ message: "Gift not found" });
    if (gift.image?.public_id) await cloudinary.uploader.destroy(gift.image.public_id);
    res.json({ message: "Gift deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

//  DISTRIBUTION 

export const distributeGift = async (req, res) => {
  try {
    const {
      giftId, recipientName, recipientType, recipientContact,
      quantity, occasion, area, notes,
      customerTier,
      proofImageBase64, proofImageMime,
    } = req.body;

    const gift = await Gift.findById(giftId);
    if (!gift)                                   return res.status(404).json({ message: "Gift not found" });
    if (gift.availableQuantity < Number(quantity)) return res.status(400).json({ message: "Insufficient stock" });

    gift.availableQuantity -= Number(quantity);
    await gift.save();

    // Upload proof image if provided
    let proofImage;
    if (proofImageBase64 && proofImageMime) {
      const uploaded = await cloudinary.uploader.upload(
        `data:${proofImageMime};base64,${proofImageBase64}`,
        { folder: "gift-proofs" }
      );
      proofImage = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const dist = await GiftDistribution.create({
      gift: giftId, agent: req.agent._id,
      recipientName, recipientType, recipientContact,
      quantity: Number(quantity), occasion, area, notes,
      ...(customerTier  ? { customerTier }  : {}),
      ...(proofImage    ? { proofImage }    : {}),
    });

    const populated = await GiftDistribution.findById(dist._id)
      .populate("gift", "name category image value");

    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const getMyDistributions = async (req, res) => {
  try {
    const data = await GiftDistribution.find({ agent: req.agent._id })
      .populate("gift", "name category image value")
      .sort({ distributedAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAllDistributions = async (req, res) => {
  try {
    const data = await GiftDistribution.find()
      .populate("gift",  "name category image value")
      .populate("agent", "name empId")
      .sort({ distributedAt: -1 });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
};