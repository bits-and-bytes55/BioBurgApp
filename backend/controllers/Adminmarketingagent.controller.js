import MarketingAgent from "../models/MarketingAgent.model.js";
import cloudinary from "../config/cloudinary.js";

export const getAllAgents = async (req, res) => {
  try {
    const agents = await MarketingAgent.find()
      .select("-password -responses")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: agents.length, agents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAgentById = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.params.id).select(
      "-password"
    );
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveAgent = async (req, res) => {
  try {
    const agent = await MarketingAgent.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-password -jobHistory -responses");

    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, message: "Agent approved", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const revokeAgent = async (req, res) => {
  try {
    const agent = await MarketingAgent.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).select("-password -jobHistory -responses");

    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, message: "Agent approval revoked", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const blockAgentGps = async (req, res) => {
  try {
    const agent = await MarketingAgent.findByIdAndUpdate(
      req.params.id,
      { isGpsBlocked: true },
      { new: true }
    ).select("-password -jobHistory -responses");

    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, message: "GPS blocked", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unblockAgentGps = async (req, res) => {
  try {
    const agent = await MarketingAgent.findByIdAndUpdate(
      req.params.id,
      { isGpsBlocked: false, gpsViolationCount: 0 },
      { new: true }
    ).select("-password -jobHistory -responses");

    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, message: "GPS unblocked and violations reset", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAgentJobHistory = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.params.id).select(
      "name jobHistory"
    );
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const jobs = [...agent.jobHistory]
      .sort((a, b) => new Date(b.jobStartTime) - new Date(a.jobStartTime))
      .map((j) => ({
        _id: j._id,
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
        startKmPhoto: j.startKmPhoto?.url || null,
        closeKmPhoto: j.closeKmPhoto?.url || null,
        hospitalImage: j.hospitalImage?.url || null,
        startProofImage: j.startProofImage?.url || null,
        visits: j.visits || [],
      }));

    res.json({ success: true, agentName: agent.name, count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update per-agent job start requirements and geofence settings
 * Body: { requireLocation, requireImage, geofenceEnabled, geofenceLat, geofenceLng, geofenceRadiusKm }
 */
export const updateAgentSettings = async (req, res) => {
  try {
    const {
      requireLocation,
      requireImage,
      geofenceEnabled,
      geofenceLat,
      geofenceLng,
      geofenceRadiusKm,
    } = req.body;

    const update = {};

    if (requireLocation !== undefined)
      update["jobStartRequirements.requireLocation"] = requireLocation;
    if (requireImage !== undefined)
      update["jobStartRequirements.requireImage"] = requireImage;
    if (geofenceEnabled !== undefined)
      update["geofence.enabled"] = geofenceEnabled;
    if (geofenceLat !== undefined)
      update["geofence.latitude"] = parseFloat(geofenceLat);
    if (geofenceLng !== undefined)
      update["geofence.longitude"] = parseFloat(geofenceLng);
    if (geofenceRadiusKm !== undefined)
      update["geofence.radiusKm"] = parseFloat(geofenceRadiusKm);

    const agent = await MarketingAgent.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).select("-password -jobHistory -responses");

    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ success: true, message: "Agent settings updated", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get a single agent's latest start-proof image and live location
 */
export const getAgentLiveData = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.params.id).select(
      "name currentLocation isOnJob jobHistory jobStartRequirements geofence"
    );
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const currentJob =
      agent.isOnJob && agent.jobHistory.length > 0
        ? agent.jobHistory[agent.jobHistory.length - 1]
        : null;

    res.json({
      success: true,
      currentLocation: agent.currentLocation || null,
      isOnJob: agent.isOnJob,
      startProofImage: currentJob?.startProofImage?.url || null,
      jobStartRequirements: agent.jobStartRequirements,
      geofence: agent.geofence,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Manually delete an agent's start-proof image from Cloudinary
 */
export const deleteStartProofImage = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const currentJob =
      agent.jobHistory.length > 0
        ? agent.jobHistory[agent.jobHistory.length - 1]
        : null;

    if (currentJob?.startProofImage?.public_id) {
      await cloudinary.uploader.destroy(currentJob.startProofImage.public_id);
      currentJob.startProofImage = undefined;
      await agent.save();
    }

    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};