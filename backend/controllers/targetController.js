import Target from "../models/Target.js";

// GET targets
export const getTargets = async (req, res) => {
  try {
    const { type } = req.query;

    const data = await Target.find({
      type,
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE target
export const createTarget = async (req, res) => {
  try {
    const target = new Target(req.body);
    const saved = await target.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// UPDATE target
export const updateTarget = async (req, res) => {
  try {
    const updated = await Target.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// DELETE target
export const deleteTarget = async (req, res) => {
  try {
    await Target.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all options grouped
export const getOptions = async (req, res) => {
  try {
    const options = await Target.find({ type: "option" });

    const grouped = {
      segments: [],
      regions: [],
      months: [],
      years: [],
    };

    options.forEach(opt => {
      if (grouped[opt.optionKey]) {
        grouped[opt.optionKey].push(opt.value);
      }
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD new option
export const addOption = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // avoid duplicates
    const exists = await Target.findOne({
      type: "option",
      optionKey: key,
      value,
    });

    if (exists) {
      return res.json(exists);
    }

    const option = new Target({
      type: "option",
      optionKey: key,
      value,
    });

    const saved = await option.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};