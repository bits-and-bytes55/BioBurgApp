import ExServiceJob from "../models/Exservicejob.js";
import ExServiceApplication from "../models/Exserviceapplication.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/exservice-resumes";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Only PDF, DOC, DOCX files are allowed"), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// JOB MANAGEMENT (Admin)

// POST /api/exservice-jobs
export const createJob = async (req, res) => {
  try {
    const job = await ExServiceJob.create(req.body);
    res.status(201).json({ success: true, message: "Job created successfully", job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exservice-jobs  (admin — all including inactive)
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await ExServiceJob.find().sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exservice-jobs/public  (public — active only)
export const getPublicJobs = async (req, res) => {
  try {
    const { serviceArm, location, jobType } = req.query;
    const query = { status: "active" };
    if (serviceArm && serviceArm !== "All") query.serviceArm = { $in: [serviceArm, "Any"] };
    if (location) query.location = { $regex: location, $options: "i" };
    if (jobType) query.jobType = jobType;

    const jobs = await ExServiceJob.find(query).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exservice-jobs/public/:id
export const getPublicJobById = async (req, res) => {
  try {
    const job = await ExServiceJob.findOne({ _id: req.params.id, status: "active" });
    if (!job) return res.status(404).json({ success: false, message: "Job not found or no longer active" });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/exservice-jobs/:id
export const updateJob = async (req, res) => {
  try {
    const job = await ExServiceJob.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job updated successfully", job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/exservice-jobs/:id
export const deleteJob = async (req, res) => {
  try {
    const job = await ExServiceJob.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// APPLICATION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// POST /api/exservice-jobs/apply
export const submitApplication = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      data.resumeUrl = req.file.path.replace(/\\/g, "/");
    }

    const existing = await ExServiceApplication.findOne({
      email: data.email,
      applyingFor: data.applyingFor,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this position with this email address.",
      });
    }

    const application = await ExServiceApplication.create(data);
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exservice-jobs/applications  (admin)
export const getAllApplications = async (req, res) => {
  try {
    const { status, serviceArm, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (serviceArm && serviceArm !== "All") query.serviceArm = serviceArm;
    if (search) {
      query.$or = [
        { fullName:    { $regex: search, $options: "i" } },
        { email:       { $regex: search, $options: "i" } },
        { applyingFor: { $regex: search, $options: "i" } },
        { rank:        { $regex: search, $options: "i" } },
      ];
    }

    const applications = await ExServiceApplication.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: applications, total: applications.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exservice-jobs/applications/:id  (admin)
export const getApplicationById = async (req, res) => {
  try {
    const application = await ExServiceApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/exservice-jobs/applications/:id  (admin — update status / note)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const validStatuses = ["pending", "reviewing", "shortlisted", "rejected", "hired"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const application = await ExServiceApplication.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    res.json({ success: true, message: "Application updated", data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/exservice-jobs/applications/:id  (admin)
export const deleteApplication = async (req, res) => {
  try {
    const application = await ExServiceApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    if (application.resumeUrl && fs.existsSync(application.resumeUrl)) {
      fs.unlinkSync(application.resumeUrl);
    }

    await application.deleteOne();
    res.json({ success: true, message: "Application deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// PIPELINE STAGE UPDATE (Admin — used by Tracking page)
// PATCH /api/exservice-jobs/applications/:id/stage
// ═══════════════════════════════════════════════════════════════

const VALID_STAGES = [
  "application_filled",
  "online_test",
  "result",
  "interview",
  "offer_letter",
  "joining",
];

export const updateApplicantStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage || !VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}`,
      });
    }

    const application = await ExServiceApplication.findByIdAndUpdate(
      id,
      { $set: { stage } },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Stage updated successfully",
      data: application,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ANALYTICS (Admin — used by Reports page)
// GET /api/exservice-jobs/analytics
// ═══════════════════════════════════════════════════════════════

export const getAnalytics = async (req, res) => {
  try {
    const [jobs, applications] = await Promise.all([
      ExServiceJob.find().sort({ createdAt: -1 }),
      ExServiceApplication.find(),
    ]);

    const stages = ["pending", "reviewing", "shortlisted", "rejected", "hired"];

    const pipeline = jobs.map((job) => {
      const jobApps = applications.filter(
        (a) => a.applyingFor?.toLowerCase().trim() === job.title?.toLowerCase().trim()
      );
      const counts = stages.reduce((acc, st) => {
        acc[st] = jobApps.filter((a) => (a.status || "pending") === st).length;
        return acc;
      }, {});
      return {
        job,
        total: jobApps.length,
        counts,
        shortlistRate: jobApps.length > 0 ? Math.round((counts.shortlisted / jobApps.length) * 100) : 0,
        hireRate:      jobApps.length > 0 ? Math.round((counts.hired      / jobApps.length) * 100) : 0,
      };
    });

    const totals = stages.reduce((acc, st) => {
      acc[st] = applications.filter((a) => (a.status || "pending") === st).length;
      return acc;
    }, {});
    totals.total = applications.length;

    const armBreakdown = ["Army", "Navy", "Air Force"].map((arm) => ({
      arm,
      count: applications.filter((a) => a.serviceArm === arm).length,
    }));

    res.json({ success: true, pipeline, totals, armBreakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};