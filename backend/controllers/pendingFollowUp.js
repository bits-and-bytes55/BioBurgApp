import FollowUp from "../models/pendingFollowup.js";

export const getFollowUps = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;

    const query = {};

    if (status) query.stage = status;

    const data = await FollowUp.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ data });

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch follow-ups" });
  }
};

// CREATE
export const createFollowUp = async (req, res) => {
  try {
    const followUp = new FollowUp(req.body);
    await followUp.save();

    res.status(201).json({ data: followUp });

  } catch (err) {
    res.status(500).json({ message: "Failed to create follow-up" });
  }
};

// UPDATE
export const updateFollowUp = async (req, res) => {
  try {
    const updated = await FollowUp.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ data: updated });

  } catch (err) {
    res.status(500).json({ message: "Failed to update follow-up" });
  }
};

// DELETE
export const deleteFollowUp = async (req, res) => {
  try {
    await FollowUp.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Failed to delete" });
  }
};