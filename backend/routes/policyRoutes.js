// routes/policyRoutes.js

import express from "express";
import Policy from "../models/Policy.js"; 

const router = express.Router();

router.get("/policies", async (req, res) => {
  try {
    const policies = await Policy.find({ isActive: true });
    res.json({ policies });
  } catch (err) {
    res.status(500).json({ message: "Error fetching policies" });
  }
});

router.get("/admin/policies", async (req, res) => {
  try {
    const policies = await Policy.find();
    res.json({ policies });
  } catch (err) {
    console.log("GET ERROR:", err); 
    res.status(500).json({ message: "Error fetching policies" });
  }
});


router.put("/admin/policies/:id", async (req, res) => {
  try {
    const updated = await Policy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ policy: updated });
  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ message: "Error updating policy" });
  }
});

router.delete("/admin/policies/:id", async (req, res) => {
  try {
    await Policy.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting policy" });
  }
});
router.post("/admin/policies", async (req, res) => {
  try {
    const policy = new Policy(req.body);
    await policy.save();
    res.json({ policy });
  } catch (err) {
    console.log("CREATE ERROR:", err);
    res.status(500).json({ message: "Error creating policy" });
  }
});
export default router;