import LabTest from "../../models/pathology/Test.js";

export const addLabTest = async (req, res) => {
  try {
    const { testName, price, description } = req.body;

    if (!testName || !price) {
      return res.status(400).json({ message: "Test name & price required" });
    }

    const test = await LabTest.create({
      labId: req.lab._id,
      testName,
      price,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Test added successfully",
      data: test,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyLabTests = async (req, res) => {
  try {
    const tests = await LabTest.find({ labId: req.lab._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: tests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteLabTest = async (req, res) => {
  try {
    const test = await LabTest.findOneAndDelete({
      _id: req.params.id,
      labId: req.lab._id,
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({
      success: true,
      message: "Test deleted",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
