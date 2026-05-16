// controllers/pfController.js
import mongoose from "mongoose";
import ProductFeedback from "../models/productFeedback.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const getAgentId = (req) => req.user?.id || req.user?._id || req.agent?.id;

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

export const createProductFeedback = async (req, res) => {
  try {
    const { customer, products, overallRating, remarks, submittedAt } = req.body;

    if (!customer?.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product rating is required",
      });
    }

    const feedback = await ProductFeedback.create({
      customer: {
        name: customer.name || "",
        phone: customer.phone || "",
        role: customer.role || "",
        area: customer.area || "",
        placeName: customer.placeName || "",
        isExisting: !!customer.isExisting,
      },
      products,
      overallRating: typeof overallRating === "number" ? overallRating : 0,
      remarks: remarks || "",
      submittedAt: submittedAt || new Date(),
      submittedBy: getAgentId(req) || null,
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Create feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

export const getAllProductFeedbacks = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);
    const visibleAgentIds = await getVisibleAgentIds(viewerAgentId);

    const feedbacks = await ProductFeedback.find({
      submittedBy: {
        $in: visibleAgentIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    })
      .populate("submittedBy", "name phone email assignedArea role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Fetch feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedbacks",
    });
  }
};
