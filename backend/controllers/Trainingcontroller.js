import mongoose from "mongoose";
import TrainingModule from "../models/Trainingmodule.js";
import MarketingAgent from "../models/MarketingAgent.model.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";

const getAgentId = (req) => req.user?.id || req.user?._id || req.agent?.id;

const getVisibleAgentIds = async (agentId) => {
  const rootId = agentId.toString();

  const rootAgent = await MarketingAgent.findById(rootId)
    .select("teamMembers role permissions")
    .lean();

  if (!rootAgent) return [rootId];

  if (rootAgent.permissions?.allAgentsAccess) {
    const allAgents = await MarketingAgent.find().select("_id").lean();
    return allAgents.map((a) => a._id.toString());
  }

  const visibleIds = new Set([rootId]);
  const queue = [...(rootAgent.teamMembers || []).map((id) => id.toString())];

  const directReports = await MarketingAgent.find({ reportsTo: rootId })
    .select("_id")
    .lean();

  directReports.forEach((agent) => {
    if (agent._id) queue.push(agent._id.toString());
  });

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visibleIds.has(currentId)) continue;

    visibleIds.add(currentId);

    const children = await MarketingAgent.find({ reportsTo: currentId })
      .select("_id teamMembers")
      .lean();

    children.forEach((child) => {
      if (child._id) queue.push(child._id.toString());
    });

    const currentAgent = await MarketingAgent.findById(currentId)
      .select("teamMembers")
      .lean();

    (currentAgent?.teamMembers || []).forEach((id) => queue.push(id.toString()));
  }

  return [...visibleIds];
};

const resolveAgentForView = async (req) => {

  const viewerAgentId =
    getAgentId(req);

  const requestedAgentId =
    req.query?.agentId ||
    req.body?.agentId ||
    viewerAgentId;

  const visibleAgentIds =
    await getVisibleAgentIds(
      viewerAgentId
    );

  return {
    viewerAgentId,

    targetAgentId:
      requestedAgentId,

    canView:
      visibleAgentIds.includes(
        requestedAgentId.toString()
      ),
  };
};
const moduleAssignmentFilter = (agentId, assignedArea) => ({
  isActive: true,
  isVisible: true,
  $or: [
    { assignmentType: "all" },
    { assignmentType: "specific", assignedAgents: agentId },
    { assignmentType: "area", assignedAreas: assignedArea || "__none__" },
  ],
});

export const listAgentsForAssignment = async (req, res) => {
  try {
    const agents = await MarketingAgent.find({ isApproved: true })
      .select("name email assignedArea role")
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
      title,
      description,
      hasVideo,
      videoUrl,
      videoPublicId,
      videoResourceType,
      hasQuiz,
      passPercent,
      watchPercent,
      questions,
      assignmentType,
      assignedAgents,
      assignedAreas,
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    if (hasVideo && !videoUrl) return res.status(400).json({ message: "Video URL required when video is enabled" });
    if (hasQuiz && (!questions || questions.length === 0)) {
      return res.status(400).json({ message: "Add at least one question when quiz is enabled" });
    }

    const module = await TrainingModule.create({
      title: title.trim(),
      description: description || "",
      hasVideo: !!hasVideo,
      videoUrl: hasVideo ? videoUrl : "",
      videoPublicId: hasVideo ? videoPublicId || "" : "",
      videoResourceType: videoResourceType || "video",
      hasQuiz: !!hasQuiz,
      passPercent: hasQuiz ? passPercent || 70 : 70,
      watchPercent: hasVideo && hasQuiz ? watchPercent || 70 : 0,
      questions: hasQuiz ? questions : [],
      assignmentType: assignmentType || "all",
      assignedAgents: assignmentType === "specific" ? assignedAgents || [] : [],
      assignedAreas: assignmentType === "area" ? assignedAreas || [] : [],
      isActive: true,
      isVisible: true,
      createdBy: req.admin?.name || req.admin?.email || req.user?.name || "admin",
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
      .populate("assignedAgents", "name email assignedArea role")
      .sort({ createdAt: -1 })
      .lean();

    const result = modules.map((m) => ({
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
      totalAttempts: m.attempts?.length || 0,
      passedAttempts: m.attempts?.filter((a) => a.passed).length || 0,
      failedAttempts: m.attempts?.filter((a) => !a.passed).length || 0,
      passRate: m.attempts?.length
        ? Math.round((m.attempts.filter((a) => a.passed).length / m.attempts.length) * 100)
        : null,
    }));

    res.json({ success: true, modules: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getModuleByIdAdmin = async (req, res) => {
  try {
    const module = await TrainingModule.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate("assignedAgents", "name email assignedArea role")
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
      title,
      description,
      hasVideo,
      videoUrl,
      videoPublicId,
      videoResourceType,
      hasQuiz,
      passPercent,
      watchPercent,
      questions,
      assignmentType,
      assignedAgents,
      assignedAreas,
    } = req.body;

    const module = await TrainingModule.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!module) return res.status(404).json({ message: "Module not found" });

    if (!hasVideo && module.hasVideo && module.videoPublicId) {
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");
    }

    if (hasVideo && videoPublicId && videoPublicId !== module.videoPublicId && module.videoPublicId) {
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");
    }

    module.title = title?.trim() || module.title;
    module.description = description ?? module.description;
    module.hasVideo = !!hasVideo;
    module.videoUrl = hasVideo ? videoUrl : "";
    module.videoPublicId = hasVideo ? videoPublicId || "" : "";
    module.videoResourceType = videoResourceType || "video";
    module.hasQuiz = !!hasQuiz;
    module.passPercent = hasQuiz ? passPercent || 70 : 70;
    module.watchPercent = hasVideo && hasQuiz ? watchPercent || 70 : 0;
    module.questions = hasQuiz ? questions || [] : [];
    module.assignmentType = assignmentType || "all";
    module.assignedAgents = assignmentType === "specific" ? assignedAgents || [] : [];
    module.assignedAreas = assignmentType === "area" ? assignedAreas || [] : [];

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

    if (module.hasVideo && module.videoPublicId) {
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");
    }

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
    const module = await TrainingModule.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!module) return res.status(404).json({ message: "Module not found" });

    module.isVisible = !module.isVisible;
    await module.save();

    res.json({
      success: true,
      isVisible: module.isVisible,
      message: module.isVisible
        ? "Module is now visible to assigned agents"
        : "Module hidden from agents",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeModuleVideo = async (req, res) => {
  try {
    const module = await TrainingModule.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!module) return res.status(404).json({ message: "Module not found" });

    if (module.videoPublicId) {
      await deleteFromCloudinary(module.videoPublicId, module.videoResourceType || "video");
    }

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

    const attempts = (module.attempts || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      title: module.title,
      passPercent: module.passPercent,
      totalAttempts: attempts.length,
      passedAttempts: attempts.filter((a) => a.passed).length,
      attempts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAgentModules = async (req, res) => {
  try {

    console.log("REQ.USER =>", req.user);

    const agentId =
      req.user?.id ||
      req.user?._id;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Agent not authenticated",
      });
    }

    const { targetAgentId, canView } =
      await resolveAgentForView(req);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot view this training",
      });
    }

    const agent =
      await MarketingAgent.findById(
        targetAgentId
      )
        .select("assignedArea")
        .lean();

    const modules =
      await TrainingModule.find(
        moduleAssignmentFilter(
          targetAgentId,
          agent?.assignedArea
        )
      )
        .select("-attempts.answers")
        .sort({ createdAt: -1 })
        .lean();

    const result = modules.map((m) => {

      const myAttempts =
        (m.attempts || []).filter(
          (a) =>
            String(a.agent) ===
            String(targetAgentId)
        );

      const hasPassed =
        myAttempts.some(
          (a) => a.passed
        );

      const lastAttempt =
        myAttempts.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )[0] || null;

      return {
        _id: m._id,

        title: m.title,

        description:
          m.description,

        hasVideo:
          m.hasVideo,

        videoUrl:
          m.videoUrl,

        hasQuiz:
          m.hasQuiz,

        passPercent:
          m.passPercent,

        watchPercent:
          m.watchPercent,

        questionCount:
          m.questions?.length || 0,

        createdAt:
          m.createdAt,

        attempted:
          myAttempts.length > 0,

        hasPassed,

        lastPassed:
          lastAttempt?.passed ?? null,

        lastScore:
          lastAttempt
            ? `${lastAttempt.score}/${lastAttempt.total}`
            : null,

        questions: [],
      };
    });

    return res.status(200).json({
      success: true,
      modules: result,
    });

  } catch (err) {

    console.log(
      "GET AGENT MODULES ERROR =>",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Server Error",
    });
  }
};

export const getAgentModuleById = async (req, res) => {
  try {
    const { targetAgentId, canView } = await resolveAgentForView(req);

    if (!canView) {
      return res.status(403).json({ message: "You cannot view this agent training" });
    }

    const agent = await MarketingAgent.findById(targetAgentId)
      .select("assignedArea")
      .lean();

    const module = await TrainingModule.findOne({
      _id: req.params.id,
      ...moduleAssignmentFilter(targetAgentId, agent?.assignedArea),
    }).lean();

    if (!module) return res.status(404).json({ message: "Module not found or not assigned" });

    const myAttempts = (module.attempts || []).filter(
      (a) => String(a.agent) === String(targetAgentId)
    );

    const safeQuestions = (module.questions || []).map((q) => ({
      _id: q._id,
      text: q.text,
      options: q.options,
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
        hasPassed: myAttempts.some((a) => a.passed),
        myAttempts: myAttempts.map((a) => ({
          score: a.score,
          total: a.total,
          passed: a.passed,
          timeTaken: a.timeTaken,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const { answers, timeTaken, watchedPct } = req.body;

    const agent = await MarketingAgent.findById(agentId)
      .select("name assignedArea")
      .lean();

    const module = await TrainingModule.findOne({
      _id: req.params.id,
      ...moduleAssignmentFilter(agentId, agent?.assignedArea),
    });

    if (!module) return res.status(404).json({ message: "Module not found" });
    if (!module.hasQuiz) return res.status(400).json({ message: "This module has no quiz" });

    if (module.hasVideo && module.watchPercent > 0 && (watchedPct || 0) < module.watchPercent) {
      return res.status(403).json({
        message: `Watch at least ${module.watchPercent}% of the video first`,
      });
    }

    if (!answers || answers.length !== module.questions.length) {
      return res.status(400).json({ message: "Answer all questions before submitting" });
    }

    let score = 0;

    for (let i = 0; i < module.questions.length; i++) {
      if (answers[i] === module.questions[i].correctIndex) score++;
    }

    const total = module.questions.length;
    const scorePct = Math.round((score / total) * 100);
    const passed = scorePct >= module.passPercent;

    await TrainingModule.findByIdAndUpdate(module._id, {
      $push: {
        attempts: {
          agent: agentId,
          agentName: agent?.name || "Unknown",
          score,
          total,
          passed,
          answers,
          timeTaken: timeTaken || "",
          watchedPct: watchedPct || 0,
        },
      },
    });

    res.json({
      success: true,
      result: {
        score,
        total,
        scorePct,
        passed,
        passPercent: module.passPercent,
        message: passed
          ? `Congratulations! You passed with ${scorePct}%.`
          : `You scored ${scorePct}%. You need ${module.passPercent}% to pass. Try again.`,
      },
    });
  } catch (err) {
    console.error("submitAttempt:", err);
    res.status(500).json({ message: err.message });
  }
};

export const markVideoComplete = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const agent = await MarketingAgent.findById(agentId)
      .select("name assignedArea")
      .lean();

    const module = await TrainingModule.findOne({
      _id: req.params.id,
      ...moduleAssignmentFilter(agentId, agent?.assignedArea),
    });

    if (!module) return res.status(404).json({ message: "Module not found" });
    if (module.hasQuiz) return res.status(400).json({ message: "This module has a quiz - use /attempt instead" });
    if (!module.hasVideo) return res.status(400).json({ message: "This module has no video" });

    const alreadyDone = (module.attempts || []).some(
      (a) => String(a.agent) === String(agentId) && a.passed
    );

    if (alreadyDone) {
      return res.json({
        success: true,
        alreadyCompleted: true,
        message: "Already completed",
      });
    }

    await TrainingModule.findByIdAndUpdate(module._id, {
      $push: {
        attempts: {
          agent: agentId,
          agentName: agent?.name || "Unknown",
          score: 1,
          total: 1,
          passed: true,
          timeTaken: "video",
          watchedPct: 100,
        },
      },
    });

    return res.json({ success: true, message: "Module marked as completed!" });
  } catch (err) {
    console.error("markVideoComplete:", err);
    return res.status(500).json({ message: err.message });
  }
};
