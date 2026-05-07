import TopPerformer from "../models/topPerformer.js";

// GET ALL
export const getPerformers = async (req, res) => {
  try {
    const data = await TopPerformer.find().sort({ rank: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE
export const createPerformer = async (req, res) => {
  try {
    const performer = new TopPerformer(req.body);
    const saved = await performer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
export const updatePerformer = async (req, res) => {
  try {
    const updated = await TopPerformer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE
export const deletePerformer = async (req, res) => {
  try {
    await TopPerformer.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};