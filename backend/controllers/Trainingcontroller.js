import TrainingModule from "../models/Trainingmodule.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";

export const listAgentsForAssignment = async (req, res) => {
  try {
    const agents = await MarketingAgent.find({})
      .select("name email assignedArea")
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, agents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTrainingModule = async (req, res) => {
  try {
    const {
      title, description,
      hasVideo, videoUrl, videoPublicId, videoResourceType,
      hasQuiz, passPercent, watchPercent, questions,
      assignmentType, assignedAgents, assignedAreas
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    if (hasVideo && !videoUrl) return res.status(400).json({ message: "Video URL required when video is enabled" });
    if (hasQuiz && (!questions || questions.length === 0))
      return res.status(400).json({ message: "Add at least one question when quiz is enabled" });

    const module = await TrainingModule.create({
      title: title.trim(),
      description: description || "",
      hasVideo: !!hasVideo,
      videoUrl: hasVideo ? videoUrl : "",
      videoPublicId: hasVideo ? (videoPublicId || "") : "",
      videoResourceType: videoResourceType || "video",
      hasQuiz: !!hasQuiz,
      passPercent: hasQuiz ? (passPercent || 70) : 70,
      watchPercent: (hasVideo && hasQuiz) ? (watchPercent || 70) : 0,
      questions: hasQuiz ? questions : [],
      assignmentType: assignmentType || "all",
      assignedAgents: assignmentType === "specific" ? (assignedAgents || []) : [],
      assignedAreas:  assignmentType === "area"     ? (assignedAreas  || []) : [],
      isActive: true,
      isVisible: true,
      createdBy: req.admin?.name || req.admin?.email || "admin"
    });

    res.status(201).json({ success: true, module });
  } catch (err) {
    console.error("createTrainingModule:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllModulesAdmin = async (req, res) => {
  try {
    const modules = await TrainingModule.find({ isActive: true })
      .populate("assignedAgents", "name email assignedArea")
      .sort({ createdAt: -1 })
      .lean();

    const result = modules.map(m => ({
      _id: m._id,
      title: m.title,
      description: m.description,
      hasVideo: m.hasVideo,
      videoUrl: m.videoUrl,
      hasQuiz: m.hasQuiz,
      passPercent: m.passPercent,
      watchPercent: m.watchPercent,
      questionCount: m.questions?.length || 0,
      isVisible: m.isVisible,
      createdAt: m.createdAt,
      assignmentType: m.assignmentType,
      assignedAgents: m.assignedAgents || [],
      assignedAreas: m.assignedAreas || [],
      totalAttempts:  m.attempts?.length || 0,
      passedAttempts: m.attempts?.filter(a => a.passed).length || 0,
      failedAttempts: m.attempts?.filter(a => !a.passed).length || 0,
      passRate: m.attempts?.length
        ? Math.round((m.attempts.filter(a => a.passed).length / m.attempts.length) * 100)
        : null
    }));

    res.json({ success: true, modules: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getModuleByIdAdmin = async (req, res) => {
  try {
    const module = await TrainingModule.findOne({ _id: req.params.id, isActive: true })
      .populate("assignedAgents", "name email assignedArea")
      .lean();
    if (!module) return res.status(404).json({ message: "Module not found" });
    res.json({ success: true, module });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTrainingModule = async (req, res) => {
  try {
    const {
      title, description,
      hasVideo, videoUrl, videoPublicId, videoResourceType,
      hasQuiz, passPercent, watchPercent, questions,
      assignmentType, assignedAgents, assignedAreas
    } = req.body;

    const module = await TrainingModule.findOne({ _id: req.params.id, isActive: true });
    if (!module) return res.status(404).json({ message: "Module not found" });

    if (!hasVideo && module.hasVideo && module.videoPublicId)
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");
    if (hasVideo && videoPublicId && videoPublicId !== module.videoPublicId && module.videoPublicId)
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");

    module.title        = title?.trim() || module.title;
    module.description  = description ?? module.description;
    module.hasVideo     = !!hasVideo;
    module.videoUrl     = hasVideo ? videoUrl : "";
    module.videoPublicId = hasVideo ? (videoPublicId || "") : "";
    module.videoResourceType = videoResourceType || "video";
    module.hasQuiz      = !!hasQuiz;
    module.passPercent  = hasQuiz ? (passPercent || 70) : 70;
    module.watchPercent = (hasVideo && hasQuiz) ? (watchPercent || 70) : 0;
    module.questions    = hasQuiz ? (questions || []) : [];
    module.assignmentType  = assignmentType || "all";
    module.assignedAgents  = assignmentType === "specific" ? (assignedAgents || []) : [];
    module.assignedAreas   = assignmentType === "area"     ? (assignedAreas  || []) : [];

    await module.save();
    res.json({ success: true, module });
  } catch (err) {
    console.error("updateTrainingModule:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteTrainingModule = async (req, res) => {
  try {
    const module = await TrainingModule.findById(req.params.id);
    if (!module) return res.status(404).json({ message: "Module not found" });
    if (module.hasVideo && module.videoPublicId)
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");
    module.isActive = false;
    module.isVisible = false;
    await module.save();
    res.json({ success: true, message: "Module deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleVisibility = async (req, res) => {
  try {
    const module = await TrainingModule.findOne({ _id: req.params.id, isActive: true });
    if (!module) return res.status(404).json({ message: "Module not found" });
    module.isVisible = !module.isVisible;
    await module.save();
    res.json({ success: true, isVisible: module.isVisible,
      message: module.isVisible ? "Module is now visible to assigned agents" : "Module hidden from agents" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeModuleVideo = async (req, res) => {
  try {
    const module = await TrainingModule.findOne({ _id: req.params.id, isActive: true });
    if (!module) return res.status(404).json({ message: "Module not found" });
    if (module.videoPublicId)
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");
    module.hasVideo = false;
    module.videoUrl = "";
    module.videoPublicId = "";
    module.watchPercent = 0;
    await module.save();
    res.json({ success: true, message: "Video removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getModuleResults = async (req, res) => {
  try {
    const module = await TrainingModule.findById(req.params.id)
      .select("title attempts passPercent")
      .lean();
    if (!module) return res.status(404).json({ message: "Module not found" });
    const attempts = (module.attempts || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      success: true,
      title: module.title,
      passPercent: module.passPercent,
      totalAttempts: attempts.length,
      passedAttempts: attempts.filter(a => a.passed).length,
      attempts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAgentModules = async (req, res) => {
  try {
    const agentId = req.user.id;
    const agent   = await MarketingAgent.findById(agentId).select("assignedArea").lean();

    // Build targeting filter
    const targetFilter = {
      isActive: true,
      isVisible: true,
      $or: [
        { assignmentType: "all" },
        { assignmentType: "specific", assignedAgents: agentId },
        { assignmentType: "area", assignedAreas: agent?.assignedArea || "__none__" }
      ]
    };

    const allModules = await TrainingModule.find(targetFilter)
      .select("-attempts.answers")
      .sort({ createdAt: -1 })
      .lean();

    const result = allModules.map(m => {
      const myAttempts  = (m.attempts || []).filter(a => String(a.agent) === String(agentId));
      const hasPassed   = myAttempts.some(a => a.passed);
      const lastAttempt = myAttempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
      return {
        _id: m._id,
        title: m.title,
        description: m.description,
        hasVideo: m.hasVideo,
        videoUrl: m.videoUrl,
        hasQuiz: m.hasQuiz,
        passPercent: m.passPercent,
        watchPercent: m.watchPercent,
        questionCount: m.questions?.length || 0,
        createdAt: m.createdAt,
        hasPassed,
        attempted: myAttempts.length > 0,
        lastScore: lastAttempt ? `${lastAttempt.score}/${lastAttempt.total}` : null,
        lastPassed: lastAttempt?.passed ?? null,
        questions: []
      };
    });

    res.json({ success: true, modules: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAgentModuleById = async (req, res) => {
  try {
    const agentId = req.user.id;
    const agent   = await MarketingAgent.findById(agentId).select("assignedArea").lean();

    const module = await TrainingModule.findOne({
      _id: req.params.id, isActive: true, isVisible: true,
      $or: [
        { assignmentType: "all" },
        { assignmentType: "specific", assignedAgents: agentId },
        { assignmentType: "area", assignedAreas: agent?.assignedArea || "__none__" }
      ]
    }).lean();

    if (!module) return res.status(404).json({ message: "Module not found or not assigned to you" });

    const myAttempts = (module.attempts || []).filter(a => String(a.agent) === String(agentId));
    const hasPassed  = myAttempts.some(a => a.passed);

    // Strip correct answers
    const safeQuestions = (module.questions || []).map(q => ({
      _id: q._id, text: q.text, options: q.options
    }));

    res.json({
      success: true,
      module: {
        _id: module._id,
        title: module.title,
        description: module.description,
        hasVideo: module.hasVideo,
        videoUrl: module.videoUrl,
        hasQuiz: module.hasQuiz,
        passPercent: module.passPercent,
        watchPercent: module.watchPercent,
        questions: safeQuestions,
        hasPassed,
        myAttempts: myAttempts.map(a => ({
          score: a.score, total: a.total, passed: a.passed,
          timeTaken: a.timeTaken, createdAt: a.createdAt
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { answers, timeTaken, watchedPct } = req.body;

    const module = await TrainingModule.findOne({ _id: req.params.id, isActive: true, isVisible: true });
    if (!module) return res.status(404).json({ message: "Module not found" });
    if (!module.hasQuiz) return res.status(400).json({ message: "This module has no quiz" });

    if (module.hasVideo && module.watchPercent > 0 && (watchedPct || 0) < module.watchPercent)
      return res.status(403).json({ message: `Watch at least ${module.watchPercent}% of the video first` });

    if (!answers || answers.length !== module.questions.length)
      return res.status(400).json({ message: "Answer all questions before submitting" });

    let score = 0;
    for (let i = 0; i < module.questions.length; i++) {
      if (answers[i] === module.questions[i].correctIndex) score++;
    }
    const total    = module.questions.length;
    const scorePct = Math.round((score / total) * 100);
    const passed   = scorePct >= module.passPercent;

    const agent = await MarketingAgent.findById(agentId).select("name").lean();

    await TrainingModule.findByIdAndUpdate(module._id, {
      $push: {
        attempts: {
          agent: agentId,
          agentName: agent?.name || "Unknown",
          score, total, passed,
          answers,
          timeTaken: timeTaken || "",
          watchedPct: watchedPct || 0
        }
      }
    });

    res.json({
      success: true,
      result: {
        score, total, scorePct, passed,
        passPercent: module.passPercent,
        message: passed
          ? `Congratulations! You passed with ${scorePct}%.`
          : `You scored ${scorePct}%. You need ${module.passPercent}% to pass. Try again.`
      }
    });
  } catch (err) {
    console.error("submitAttempt:", err);
    res.status(500).json({ message: err.message });
  }
};