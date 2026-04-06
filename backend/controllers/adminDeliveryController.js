import DeliveryAgent from "../models/DeliveryAgent.js";
import Order from "../models/Order.js";
import DeliveryZone from "../models/DeliveryZone.js";

/* ================= DASHBOARD STATS ================= */
export const getDeliveryStats = async (req, res) => {
  const totalAgents = await DeliveryAgent.countDocuments();
  const onlineAgents = await DeliveryAgent.countDocuments({ availability: "online" });
  const activeOrders = await Order.countDocuments({ orderStatus: "OUT_FOR_DELIVERY" });
  const deliveredOrders = await Order.countDocuments({ orderStatus: "DELIVERED" });

  res.json({
    success: true,
    data: { totalAgents, onlineAgents, activeOrders, deliveredOrders }
  });
};

/* ================= AGENTS ================= */
export const getAgents = async (req, res) => {
  const agents = await DeliveryAgent.find().select("-password");
  res.json({ success: true, data: agents });
};

export const deleteAgent = async (req, res) => {
  await DeliveryAgent.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

export const updateAgent = async (req, res) => {
  await DeliveryAgent.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
};

/* ================= ORDERS ================= */
export const getOrders = async (req, res) => {
  const orders = await Order.find().populate("userId");
  res.json({ success: true, data: orders });
};

export const assignOrder = async (req, res) => {
  const { agentId } = req.body;

  await Order.findByIdAndUpdate(req.params.id, {
    orderStatus: "OUT_FOR_DELIVERY"
  });

  await DeliveryAgent.findByIdAndUpdate(agentId, {
    currentOrder: req.params.id,
    availability: "offline"
  });

  res.json({ success: true });
};

/* ================= ZONES ================= */
export const getZones = async (req, res) => {
  const zones = await DeliveryZone.find();
  res.json({ success: true, data: zones });
};

export const createZone = async (req, res) => {
  const zone = await DeliveryZone.create(req.body);
  res.json({ success: true, data: zone });
};

export const deleteZone = async (req, res) => {
  await DeliveryZone.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};