import Job from "../models/jobManage.js";

// ── ADMIN: Create ─────────────────────────────────────────────────
export const createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Get all (including inactive) ──────────────────────────
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ── ADMIN: Update ─────────────────────────────────────────────────
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ── ADMIN: Delete ─────────────────────────────────────────────────
export const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ── PUBLIC: Get all active jobs ───────────────────────────────────
export const getPublicJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "active" }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUBLIC: Get single active job by ID ──────────────────────────
export const getPublicJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: "active" });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};