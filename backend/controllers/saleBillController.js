import mongoose from "mongoose";
import Product from "../models/Product.js";
import Party from "../models/Party.js";
import SaleBill from "../models/SaleBill.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const getAgentId = (req) => req.user?.id || req.agent?.id;

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

const getVisibleAgents = async (agentId) => {
  const ids = await getVisibleAgentIds(agentId);

  return MarketingAgent.find({
    _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select("_id name vendor role assignedArea")
    .lean();
};

const getAgentWithVendor = async (agentId) => {
  return MarketingAgent.findById(agentId).select("_id name vendor").lean();
};

/* =======================
   CREATE PARTY
======================= */
export const createParty = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const agent = await getAgentWithVendor(agentId);

    if (!agent || !agent.vendor) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const { name, phone, address, city, type } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Party name is required" });
    }

    if (!phone?.trim()) {
      return res.status(400).json({ message: "Party phone is required" });
    }

    const existing = await Party.findOne({
      phone,
      vendor: agent.vendor,
    });

    if (existing) {
      return res.status(400).json({ message: "Party already exists" });
    }

    const party = await Party.create({
      vendor: agent.vendor,
      createdByAgent: agent._id,
      name,
      phone,
      address,
      city,
      type,
    });

    res.json({ success: true, party });
  } catch (err) {
    console.error("CREATE PARTY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   GET AGENT PRODUCTS
======================= */
export const getAgentProducts = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const visibleAgents = await getVisibleAgents(agentId);

    const vendorIds = [
      ...new Set(
        visibleAgents
          .map((agent) => agent.vendor?.toString())
          .filter(Boolean)
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    if (!vendorIds.length) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const products = await Product.find({
      vendor: { $in: vendorIds },
      isActive: true,
      stock: { $gt: 0 },
    }).lean();

    res.json(products);
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   GET AGENT PARTIES
======================= */
export const getAgentParties = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const visibleAgents = await getVisibleAgents(agentId);

    const vendorIds = [
      ...new Set(
        visibleAgents
          .map((agent) => agent.vendor?.toString())
          .filter(Boolean)
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    if (!vendorIds.length) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const parties = await Party.find({
      vendor: { $in: vendorIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(parties);
  } catch (err) {
    console.error("GET PARTIES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   CREATE SALE BILL
======================= */
export const createSaleBill = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const agent = await getAgentWithVendor(agentId);

    if (!agent || !agent.vendor) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const { partyId, items } = req.body;

    if (!partyId) {
      return res.status(400).json({ message: "Party is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const party = await Party.findOne({
      _id: partyId,
      vendor: agent.vendor,
    }).lean();

    if (!party) {
      return res.status(404).json({ message: "Party not found for this vendor" });
    }

    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const bill = await SaleBill.create({
      vendor: agent.vendor,
      marketingAgent: agent._id,
      party: partyId,
      billNo: `SB-${Date.now()}`,
      items,
      totalAmount: total,
      invoiceValue: total,
    });

    res.json({ success: true, bill });
  } catch (err) {
    console.error("CREATE BILL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
