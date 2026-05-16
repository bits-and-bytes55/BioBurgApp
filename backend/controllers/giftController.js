import mongoose from "mongoose";
import Gift from "../models/gift.js";
import GiftDistribution from "../models/giftDistribution.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import cloudinary from "../config/cloudinary.js";

const getAgentId = (req) =>
  req.user?.id || req.user?._id || req.agent?._id || req.agent?.id;

const getVisibleAgentIds = async (agentId) => {
  const rootId = agentId.toString();

  const rootAgent = await MarketingAgent.findById(rootId)
  .select("teamMembers role permissions")
  .lean();

if (!rootAgent) return [rootId];

if (rootAgent.permissions?.allAgentsAccess) {
  const allAgents = await MarketingAgent.find().select("_id").lean();
  return allAgents.map((a) => a._id.toString());
}


  const visibleIds = new Set([rootId]);
  const queue = [...(rootAgent.teamMembers || []).map((id) => id.toString())];

  const directReports = await MarketingAgent.find({ reportsTo: rootId })
    .select("_id")
    .lean();

  directReports.forEach((agent) => {
    if (agent._id) queue.push(agent._id.toString());
  });

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visibleIds.has(currentId)) continue;

    visibleIds.add(currentId);

    const children = await MarketingAgent.find({ reportsTo: currentId })
      .select("_id teamMembers")
      .lean();

    children.forEach((child) => {
      if (child._id) queue.push(child._id.toString());
    });

    const currentAgent = await MarketingAgent.findById(currentId)
      .select("teamMembers")
      .lean();

    (currentAgent?.teamMembers || []).forEach((id) => {
      queue.push(id.toString());
    });
  }

  return [...visibleIds];
};

const getVisibleAgentObjectIds = async (agentId) => {
  const ids = await getVisibleAgentIds(agentId);
  return ids.map((id) => new mongoose.Types.ObjectId(id));
};

// CATALOG

export const getAllGifts = async (req, res) => {
  try {
    const gifts = await Gift.find().sort({ createdAt: -1 }).lean();
    res.json(gifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGiftStats = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const [gifts, distributions] = await Promise.all([
      Gift.find().lean(),
      GiftDistribution.find({ agent: { $in: visibleAgentIds } }).lean(),
    ]);

    const totalGifts = gifts.length;
    const inStock = gifts.filter((g) => g.availableQuantity > 0).length;
    const lowStock = gifts.filter(
      (g) => g.availableQuantity > 0 && g.availableQuantity <= 5
    ).length;
    const outOfStock = gifts.filter((g) => g.availableQuantity === 0).length;
    const totalValue = gifts.reduce(
      (s, g) => s + (g.value || 0) * (g.availableQuantity || 0),
      0
    );
    const distributed = distributions.reduce(
      (s, d) => s + (d.quantity || 0),
      0
    );

    const byCategory = gifts.reduce((acc, gift) => {
      acc[gift.category] = (acc[gift.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalGifts,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      distributed,
      byCategory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createGift = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const {
      name,
      category,
      description,
      totalQuantity,
      value,
      imageBase64,
      imageMimeType,
    } = req.body;

    let image = { url: "", public_id: "" };

    if (imageBase64) {
      const uploaded = await cloudinary.uploader.upload(
        `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`,
        { folder: "gifts" }
      );
      image = { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    const quantity = Number(totalQuantity) || 0;

    const gift = await Gift.create({
      name,
      category,
      description,
      totalQuantity: quantity,
      availableQuantity: quantity,
      value: Number(value) || 0,
      image,
      addedBy: agentId,
    });

    res.status(201).json(gift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateGift = async (req, res) => {
  try {
    const { imageBase64, imageMimeType, removeImage, ...rest } = req.body;

    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ message: "Gift not found" });

    if (imageBase64) {
      if (gift.image?.public_id) {
        await cloudinary.uploader.destroy(gift.image.public_id);
      }

      const uploaded = await cloudinary.uploader.upload(
        `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`,
        { folder: "gifts" }
      );

      rest.image = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    } else if (removeImage) {
      if (gift.image?.public_id) {
        await cloudinary.uploader.destroy(gift.image.public_id);
      }

      rest.image = { url: "", public_id: "" };
    }

    if (rest.totalQuantity !== undefined) {
      const diff = Number(rest.totalQuantity) - gift.totalQuantity;
      rest.availableQuantity = Math.max(0, gift.availableQuantity + diff);
    }

    Object.assign(gift, rest);
    await gift.save();

    res.json(gift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteGift = async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);
    if (!gift) return res.status(404).json({ message: "Gift not found" });

    if (gift.image?.public_id) {
      await cloudinary.uploader.destroy(gift.image.public_id);
    }

    res.json({ message: "Gift deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DISTRIBUTION

export const distributeGift = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const {
      giftId,
      agentId,
      recipientName,
      recipientType,
      recipientContact,
      quantity,
      occasion,
      area,
      notes,
      customerTier,
      proofImageBase64,
      proofImageMime,
    } = req.body;

    const targetAgentId = agentId
      ? new mongoose.Types.ObjectId(agentId)
      : new mongoose.Types.ObjectId(viewerAgentId);

    const canDistributeForAgent = visibleAgentIds.some(
      (id) => id.toString() === targetAgentId.toString()
    );

    if (!canDistributeForAgent) {
      return res.status(403).json({
        message: "You cannot distribute gift for this agent",
      });
    }

    const gift = await Gift.findById(giftId);
    if (!gift) return res.status(404).json({ message: "Gift not found" });

    const qty = Number(quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: "Invalid quantity" });

    if (gift.availableQuantity < qty) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    gift.availableQuantity -= qty;
    await gift.save();

    let proofImage;

    if (proofImageBase64 && proofImageMime) {
      const uploaded = await cloudinary.uploader.upload(
        `data:${proofImageMime};base64,${proofImageBase64}`,
        { folder: "gift-proofs" }
      );

      proofImage = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const dist = await GiftDistribution.create({
      gift: giftId,
      agent: targetAgentId,
      recipientName,
      recipientType,
      recipientContact,
      quantity: qty,
      occasion,
      area,
      notes,
      ...(customerTier ? { customerTier } : {}),
      ...(proofImage ? { proofImage } : {}),
    });

    const populated = await GiftDistribution.findById(dist._id)
      .populate("gift", "name category image value")
      .populate("agent", "name phone email assignedArea role");

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMyDistributions = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { agentId } = req.query;

    const filter = {
      agent: { $in: visibleAgentIds },
    };

    if (agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(agentId);
      const canView = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canView) {
        return res.status(403).json({
          message: "You cannot view this agent distributions",
        });
      }

      filter.agent = requestedAgentId;
    }

    const data = await GiftDistribution.find(filter)
      .populate("gift", "name category image value")
      .populate("agent", "name phone email assignedArea role")
      .sort({ distributedAt: -1 })
      .lean();

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllDistributions = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);

    const data = await GiftDistribution.find({
      agent: { $in: visibleAgentIds },
    })
      .populate("gift", "name category image value")
      .populate("agent", "name phone email assignedArea role")
      .sort({ distributedAt: -1 })
      .lean();

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
