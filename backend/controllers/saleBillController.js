import Product from "../models/Product.js";
import Party from "../models/Party.js";
import SaleBill from "../models/SaleBill.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

/* =======================
   CREATE PARTY
======================= */
export const createParty = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.agent.id);

    if (!agent || !agent.vendor) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const { name, phone, address, city, type } = req.body;

    const existing = await Party.findOne({
      phone,
      vendor: agent.vendor
    });

    if (existing) {
      return res.status(400).json({ message: "Party already exists" });
    }

    const party = await Party.create({
      vendor: agent.vendor,
      name,
      phone,
      address,
      city,
      type
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
    const agent = await MarketingAgent.findById(req.agent.id);

    if (!agent || !agent.vendor) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const products = await Product.find({
      vendor: agent.vendor,
      isActive: true,
      stock: { $gt: 0 }
    });

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
    const agent = await MarketingAgent.findById(req.agent.id);

    if (!agent || !agent.vendor) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const parties = await Party.find({ vendor: agent.vendor });
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
    const agent = await MarketingAgent.findById(req.agent.id);

    if (!agent || !agent.vendor) {
      return res.status(400).json({ message: "Agent or vendor not found" });
    }

    const { partyId, items } = req.body;

    let total = 0;
    items.forEach(i => total += i.amount);

    const bill = await SaleBill.create({
      vendor: agent.vendor,
      marketingAgent: agent._id,
      party: partyId,
      billNo: "SB-" + Date.now(),
      items,
      totalAmount: total,
      invoiceValue: total
    });

    res.json({ success: true, bill });
  } catch (err) {
    console.error("CREATE BILL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
