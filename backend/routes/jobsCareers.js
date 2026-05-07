import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";                                  
import nodemailer from "nodemailer";                          
import JobApplication from "../models/JobApplication.js";
import { getStageEmail } from "../utils/emailTemplates.js"; 
import { getDomainForRole, getQuestionsForDomain } from "../utils/mcqBank.js"; 

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

//  Multer setup 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/resumes");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `resume_${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext)
      ? cb(null, true)
      : cb(new Error("Only PDF/DOC files are allowed"));
  },
});

const EMAIL_ENABLED = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = EMAIL_ENABLED
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

const sendMail = async ({ to, subject, html }) => {
  if (!EMAIL_ENABLED || !transporter) {
    console.log("[Email disabled] Would send: " + subject + " to " + to);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to, subject, html,
    });
  } catch (err) {
    console.error("[Email failed]", err.message); 
  }
};

const PASS_THRESHOLD = 12; 

// ── PUBLIC: Submit application ────────────────────────────────────────────────
router.post("/register", upload.single("resume"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.resumeUrl = `uploads/resumes/${req.file.filename}`;

    const application = new JobApplication(data);
    await application.save();

    // Auto-send application confirmation email (non-blocking)
    try {
      const emailData = getStageEmail("application_filled", {
        name:    application.fullName,
        role:    application.applyingFor,
        jobType: application.jobType,
      });
      if (emailData) {
        await sendMail({ to: application.email, ...emailData });
        application.emailsSent.push({ stage: "application_filled", subject: emailData.subject });
        await application.save();
      }
    } catch (emailErr) {
      console.error("Auto confirmation email failed:", emailErr.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (err) {
    console.error("Job application submit error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Get all applications ───────────────────────────────────────────────
router.get("/applications", async (req, res) => {
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (err) {
    console.error("Fetch applications error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Update status + admin note ────────────────────────────────────────
router.put("/applications/:id/status", async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    if (!application)
      return res.status(404).json({ success: false, message: "Application not found" });

    res.json({ success: true, data: application });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Delete application ─────────────────────────────────────────────────
router.delete("/applications/:id", async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application)
      return res.status(404).json({ success: false, message: "Application not found" });

    if (application.resumeUrl) {
      const filePath = path.join(__dirname, "..", application.resumeUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await JobApplication.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Application deleted successfully" });
  } catch (err) {
    console.error("Delete application error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/applications/:id/stage", async (req, res) => {
  try {
    const { stage, interviewLink, interviewScheduled } = req.body;

    const validStages = [
      "application_filled", "online_test", "result",
      "interview", "offer_letter", "joining",
    ];
    if (!validStages.includes(stage))
      return res.status(400).json({ success: false, message: "Invalid stage value" });

    const app = await JobApplication.findById(req.params.id);
    if (!app)
      return res.status(404).json({ success: false, message: "Application not found" });

    app.stage = stage;

    if (stage === "online_test") {
      // Generate unique test token + auto-detect question domain
      const token   = crypto.randomUUID();
      const domain  = getDomainForRole(app.applyingFor, app.skills);
      const testUrl = `${process.env.FRONTEND_URL}/test/${token}`;

      app.testToken  = token;
      app.testSentAt = new Date();
      app.testDomain = domain;
      app.testResult = "pending";

      const emailData = getStageEmail("online_test", {
        name: app.fullName, role: app.applyingFor, testUrl,
      });
      if (emailData) {
        await sendMail({ to: app.email, ...emailData });
        app.emailsSent.push({ stage: "online_test", subject: emailData.subject });
      }

    } else if (stage === "interview") {
      if (interviewLink)    app.interviewLink      = interviewLink;
      if (interviewScheduled) app.interviewScheduled = new Date(interviewScheduled);

      const scheduledDate = app.interviewScheduled
        ? new Date(app.interviewScheduled).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
        : null;
      const scheduledTime = app.interviewScheduled
        ? new Date(app.interviewScheduled).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        : null;

      const emailData = getStageEmail("interview", {
        name: app.fullName, role: app.applyingFor,
        zoomLink: app.interviewLink,
        scheduledDate, scheduledTime,
      });
      if (emailData) {
        await sendMail({ to: app.email, ...emailData });
        app.emailsSent.push({ stage: "interview", subject: emailData.subject });
        app.interviewEmailSent = true;
      }

    } else {
      // application_filled, result, offer_letter, joining — send stage email
      const emailData = getStageEmail(stage, {
        name: app.fullName, role: app.applyingFor, jobType: app.jobType,
      });
      if (emailData) {
        await sendMail({ to: app.email, ...emailData });
        app.emailsSent.push({ stage, subject: emailData.subject });
      }
    }

    await app.save();
    res.json({ success: true, data: app });
  } catch (err) {
    console.error("Stage update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/applications/:id/send-result-email", async (req, res) => {
  try {
    const { passed } = req.body;

    const app = await JobApplication.findById(req.params.id);
    if (!app)
      return res.status(404).json({ success: false, message: "Application not found" });

    const emailData = getStageEmail("result", {
      name:  app.fullName,
      role:  app.applyingFor,
      score: app.testScore ?? 0,
      passed,
    });

    if (emailData) {
      await sendMail({ to: app.email, ...emailData });
      app.emailsSent.push({ stage: "result", subject: emailData.subject });
      app.testPassed      = passed;
      app.testResult      = passed ? "pass" : "fail";
      app.resultEmailSent = true;
      await app.save();
    }

    res.json({
      success: true,
      message: `Result email (${passed ? "PASS" : "FAIL"}) sent to ${app.email}`,
    });
  } catch (err) {
    console.error("Send result email error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/test/:token", async (req, res) => {
  try {
    const app = await JobApplication.findOne({ testToken: req.params.token });
    if (!app)
      return res.status(404).json({ success: false, message: "Invalid or expired test link" });
    if (app.testSubmittedAt)
      return res.status(410).json({ success: false, message: "Test already submitted" });

    const questions = getQuestionsForDomain(app.testDomain || "general");

    // Record first-open time
    if (!app.testStartedAt) {
      app.testStartedAt = new Date();
      await app.save();
    }

    // Strip correct answers before sending to candidate
    const safeQuestions = questions.map(({ q, options }, i) => ({ index: i, q, options }));

    res.json({
      success:        true,
      applicantName:  app.fullName,
      role:           app.applyingFor,
      domain:         app.testDomain,
      totalQuestions: 20,
      timeLimitMinutes: 30,
      questions:      safeQuestions,
    });
  } catch (err) {
    console.error("Fetch test error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/test/:token/submit", async (req, res) => {
  try {
    const { answers } = req.body;

    const app = await JobApplication.findOne({ testToken: req.params.token });
    if (!app)
      return res.status(404).json({ success: false, message: "Invalid test link" });
    if (app.testSubmittedAt)
      return res.status(410).json({ success: false, message: "Test already submitted" });

    const questions = getQuestionsForDomain(app.testDomain || "general");

    let score = 0;
    const gradedAnswers = answers.map(({ questionIndex, selected }) => {
      const q       = questions[questionIndex];
      const correct = q ? selected === q.answer : false;
      if (correct) score++;
      return { questionIndex, selected, correct };
    });

    const passed = score >= PASS_THRESHOLD;

    app.testAnswers     = gradedAnswers;
    app.testScore       = score;
    app.testPassed      = passed;
    app.testResult      = passed ? "pass" : "fail";
    app.testSubmittedAt = new Date();
    await app.save();

    res.json({
      success:    true,
      score,
      total:      20,
      passed,
      percentage: Math.round((score / 20) * 100),
      message:    passed
        ? "Congratulations! You passed. Our team will contact you shortly."
        : "Thank you for attempting the test. Our team will review your application.",
    });
  } catch (err) {
    console.error("Test submit error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/applications/:id/interview", async (req, res) => {
  try {
    const { interviewLink, interviewScheduled } = req.body;

    const app = await JobApplication.findById(req.params.id);
    if (!app)
      return res.status(404).json({ success: false, message: "Application not found" });

    if (interviewLink)      app.interviewLink      = interviewLink;
    if (interviewScheduled) app.interviewScheduled = new Date(interviewScheduled);

    const scheduledDate = app.interviewScheduled
      ? new Date(app.interviewScheduled).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
      : null;
    const scheduledTime = app.interviewScheduled
      ? new Date(app.interviewScheduled).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      : null;

    const emailData = getStageEmail("interview", {
      name: app.fullName, role: app.applyingFor,
      zoomLink: app.interviewLink,
      scheduledDate, scheduledTime,
    });

    if (emailData) {
      await sendMail({ to: app.email, ...emailData });
      app.emailsSent.push({ stage: "interview_resend", subject: emailData.subject });
      app.interviewEmailSent = true;
    }

    await app.save();
    res.json({ success: true, message: "Interview email sent", data: app });
  } catch (err) {
    console.error("Interview update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;