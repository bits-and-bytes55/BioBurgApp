import Franchise from "../models/Franchise.js";

export const applyFranchise = async (req, res) => {
  const data = await Franchise.create(req.body);
  res.json(data);
};