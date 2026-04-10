import MarketingAgent from "../models/MarketingAgent.model.js";
import generateToken from "../utils/generateTokenMarketingAgent.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/* ── Helpers ── */

const isFakeLocation = ({ accuracy, speed, distanceJumpKm }) => {
  if (accuracy > 500) return "Low GPS accuracy";
  if (speed > 150) return "Unrealistic speed detected";
  if (distanceJumpKm > 2) return "Sudden location jump detected";
  return null;
};

/**
 * Haversine distance in km between two lat/lng pairs
 */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Schedule Cloudinary image deletion after 24 hours
 */
const scheduleCloudinaryDelete = (publicId, delayMs = 24 * 60 * 60 * 1000) => {
  setTimeout(async () => {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (_) {}
  }, delayMs);
};

/* ── REGISTER ── */
export const registerAgent = async (req, res) => {
  try {
    const { name, email, phone, password, assignedArea } = req.body;

    const exists = await MarketingAgent.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Agent already registered" });
    }

    const agent = await MarketingAgent.create({
      name,
      email,
      phone,
      password,
      assignedArea,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Awaiting admin approval.",
      agent: { id: agent._id, name: agent.name, email: agent.email, role: agent.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── LOGIN ── */
export const loginAgent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await MarketingAgent.findOne({ email });

    if (!agent || !(await agent.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!agent.isApproved) {
      return res.status(403).json({
        message: "Account pending admin approval. Contact your manager.",
      });
    }

    res.json({
      success: true,
      token: generateToken(agent._id, agent.role),
      agent: { id: agent._id, name: agent.name, email: agent.email, role: agent.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── PROFILE ── */
export const getAgentProfile = async (req, res) => {
  try {
    console.log("req.user →", req.user); // ADD THIS
    const agent = await MarketingAgent.findById(req.user.id).select("-password");
    res.json({ success: true, data: agent });
  } catch (err) {
    console.error("getAgentProfile crash →", err.message); // AND THIS
    res.status(500).json({ message: err.message });
  }
};

/* ── GET JOB REQUIREMENTS (for agent frontend) ── */
export const getJobRequirements = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id).select(
      "jobStartRequirements geofence assignedArea"
    );
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({
      success: true,
      requirements: agent.jobStartRequirements || {
        requireLocation: true,
        requireImage: false,
      },
      geofence: agent.geofence || { enabled: false },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── START JOB ── */
export const startJob = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  if (agent.isGpsBlocked)
    return res.status(403).json({ message: "GPS is blocked. Contact admin." });

  if (agent.isOnJob)
    return res.status(400).json({ message: "A job is already running" });

  const {
    latitude,
    longitude,
    locationAccuracy,
    state,
    district,
    area,
    address,
    startKm,
    startProofImageBase64,
    startProofImageMimeType,
  } = req.body;

  const requirements = agent.jobStartRequirements || {
    requireLocation: true,
    requireImage: false,
  };

  // Validate location requirement
  if (requirements.requireLocation) {
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required to start a job" });
    }
    const fakeReason = isFakeLocation({
      accuracy: locationAccuracy || 0,
      speed: 0,
      distanceJumpKm: 0,
    });
    if (fakeReason) {
      agent.gpsViolationCount += 1;
      if (agent.gpsViolationCount >= 3) agent.isGpsBlocked = true;
      await agent.save();
      return res.status(400).json({ message: fakeReason });
    }
  }

  // Validate image requirement
  if (requirements.requireImage && !startProofImageBase64) {
    return res.status(400).json({ message: "A start-of-job photo is required" });
  }

  // Upload proof image to Cloudinary with 24h auto-delete
  let startProofImage;
  if (startProofImageBase64) {
    const uploadResult = await cloudinary.uploader.upload(
      `data:${startProofImageMimeType || "image/jpeg"};base64,${startProofImageBase64}`,
      {
        folder: "agent_start_proof",
        resource_type: "image",
      }
    );
    startProofImage = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      uploadedAt: new Date(),
    };
    // Auto-delete from Cloudinary after 24 hours
    scheduleCloudinaryDelete(uploadResult.public_id);
  }

  agent.isOnJob = true;
  agent.jobHistory.push({
    latitude,
    longitude,
    accuracy: locationAccuracy,
    state,
    district,
    area,
    address,
    startKm: parseFloat(startKm) || 0,
    startProofImage,
  });

  await agent.save();
  res.json({ success: true, message: "Job started" });
};

/* ── JOB STATUS ── */
export const getJobStatus = async (req, res) => {
  const agent = await MarketingAgent.findById(req.agent._id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  const currentJob =
    agent.jobHistory.length > 0
      ? agent.jobHistory[agent.jobHistory.length - 1]
      : null;

  res.json({ success: true, isOnJob: agent.isOnJob, currentJob });
};

/* ── LIVE LOCATION UPDATE (fixes 404) ── */
export const updateLiveLocation = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  if (!agent.isOnJob) {
    return res.status(400).json({ message: "No active job" });
  }

  const { latitude, longitude, accuracy, speed, distanceJumpKm } = req.body;

  const fakeReason = isFakeLocation({
    accuracy: accuracy || 0,
    speed: speed || 0,
    distanceJumpKm: distanceJumpKm || 0,
  });

  if (fakeReason) {
    const job = agent.jobHistory.at(-1);
    if (job) {
      job.jobStatus = "force_closed";
      agent.isOnJob = false;
      agent.gpsViolationCount += 1;
      if (agent.gpsViolationCount >= 3) agent.isGpsBlocked = true;
    }
    await agent.save();
    return res.status(403).json({ message: fakeReason });
  }

  // Check geofence
  let geofenceAlert = null;
  if (
    agent.geofence?.enabled &&
    agent.geofence.latitude &&
    agent.geofence.longitude
  ) {
    const distFromHome = haversineKm(
      latitude,
      longitude,
      agent.geofence.latitude,
      agent.geofence.longitude
    );
    if (distFromHome > agent.geofence.radiusKm) {
      geofenceAlert = {
        outside: true,
        distanceKm: parseFloat(distFromHome.toFixed(2)),
        radiusKm: agent.geofence.radiusKm,
      };
    }
  }

  // Update route path
  const job = agent.jobHistory.at(-1);
  if (job) {
    job.routePath.push({
      latitude,
      longitude,
      accuracy,
      speed,
      recordedAt: new Date(),
    });
  }

  agent.currentLocation = {
    latitude,
    longitude,
    accuracy,
    speed,
    updatedAt: new Date(),
  };

  await agent.save();
  res.json({ success: true, geofenceAlert });
};

/* ── CLOSE JOB ── */
export const closeJob = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id);
  if (!agent || !agent.isOnJob)
    return res.status(400).json({ message: "No active job" });

  const job = agent.jobHistory.at(-1);
  if (!job) return res.status(400).json({ message: "No job found" });

  job.totalDistanceKm = Number(req.body.totalDistanceKm) || 0;
  job.closeKm = job.totalDistanceKm;
  job.closeKmPhoto = req.body.closeKmPhoto;
  job.jobStatus = "closed";
  job.jobEndTime = new Date();

  agent.isOnJob = false;
  await agent.save();

  res.json({ success: true, message: "Job closed" });
};

/* ── SAVE JOB DETAILS ── */
export const saveJobDetails = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent || agent.jobHistory.length === 0) {
      return res.status(400).json({ message: "No active job found" });
    }

    const job = agent.jobHistory[agent.jobHistory.length - 1];

    job.partner = req.body.partner || job.partner;
    if (!job.visits) job.visits = [];

    job.visits.push({
      place: req.body.hospitalName,
      area: req.body.area,
      address: req.body.address,
      createdAt: new Date(),
    });

    const fields = [
      "doctorName","degree","mobile","whatsapp",
      "state","district","area","address",
    ];
    fields.forEach((f) => {
      if (req.body[f]) job[f] = req.body[f];
    });

    if (req.body.startKmPhoto?.url) job.startKmPhoto = req.body.startKmPhoto;
    if (req.body.closeKmPhoto?.url) job.closeKmPhoto = req.body.closeKmPhoto;
    if (req.body.hospitalImage?.url) job.hospitalImage = req.body.hospitalImage;

    await agent.save();
    res.json({ success: true, message: "Job details saved" });
  } catch (error) {
    res.status(500).json({ message: "Failed to save job details" });
  }
};

/* ── PROFILE WITH JOB ── */
export const getAgentProfileWithJob = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id).lean();
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  const currentJob =
    agent.jobHistory && agent.jobHistory.length > 0
      ? agent.jobHistory[agent.jobHistory.length - 1]
      : null;

  res.json({
    success: true,
    agent: {
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      assignedArea: agent.assignedArea,
      isOnJob: agent.isOnJob,
      gpsViolationCount: agent.gpsViolationCount,
      isGpsBlocked: agent.isGpsBlocked,
    },
    currentJob,
    currentLocation: agent.currentLocation,
  });
};

/* ── COMPLETED LEADS ── */
export const getCompletedLeads = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  const leads = agent.jobHistory
    .filter((j) => j.jobStatus === "closed" || j.jobStatus === "force_closed")
    .map((j) => ({
      id: j._id,
      jobStatus: j.jobStatus,
      jobStartTime: j.jobStartTime,
      jobEndTime: j.jobEndTime,
      totalDistanceKm: j.totalDistanceKm,
      state: j.state,
      district: j.district,
      area: j.area,
      address: j.address,
      partner: j.partner,
      hospitalName: j.hospitalName,
      doctorName: j.doctorName,
      degree: j.degree,
      mobile: j.mobile,
      whatsapp: j.whatsapp,
      startKmPhoto: j.startKmPhoto?.url || null,
      closeKmPhoto: j.closeKmPhoto?.url || null,
      hospitalImage: j.hospitalImage?.url || null,
    }));

  res.json({ success: true, count: leads.length, leads });
};

/* ── AGENT PRODUCTS ── */
export const getAgentProducts = async (req, res) => {
  try {
    const products = await Product.find({
      statusActive: "active",
      statusAppear: "appear",
    }).select(
      "title brandName category shortDescription mrp price discountPercent offerText stock variants isOTC images primaryImageIndex"
    );
    res.json({ success: true, products });
  } catch {
    res.status(500).json({ success: false, message: "Products load failed" });
  }
};

/* ── JOB HISTORY ── */
export const getJobHistory = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const jobs = [...agent.jobHistory]
      .sort((a, b) => new Date(b.jobStartTime) - new Date(a.jobStartTime))
      .map((j) => ({
        _id: j._id,
        dutyDate: j.jobStartTime,
        dutyTime: j.jobStartTime
          ? new Date(j.jobStartTime).toLocaleTimeString("en-IN")
          : null,
        status:
          j.jobStatus === "closed"
            ? "completed"
            : j.jobStatus === "force_closed"
            ? "cancelled"
            : j.jobStatus === "started"
            ? "in-progress"
            : "pending",
        hospitalName: j.hospitalName,
        doctorName: j.doctorName,
        degree: j.degree,
        mobile: j.mobile,
        whatsapp: j.whatsapp,
        partner: j.partner,
        area: j.area,
        district: j.district,
        state: j.state,
        address: j.address,
        startKm: j.startKm,
        closeKm: j.closeKm,
        totalDistanceKm: j.totalDistanceKm,
        hospitalImage: j.hospitalImage,
        jobStartTime: j.jobStartTime,
        jobEndTime: j.jobEndTime,
      }));

    res.status(200).json({ jobs });
  } catch {
    res.status(500).json({ message: "Failed to fetch job history" });
  }
};

/* ── RESPONSES ── */
export const saveResponse = async (req, res) => {
  try {
    const updated = await MarketingAgent.findByIdAndUpdate(
      req.user.id,
      { $push: { responses: req.body } },
      { new: true, runValidators: false }
    );
    if (!updated) return res.status(404).json({ message: "Agent not found" });
    const saved = updated.responses[updated.responses.length - 1];
    res.status(201).json({ success: true, response: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getResponses = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id)
      .select("responses")
      .lean();
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const responses = (agent.responses || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ success: true, responses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
