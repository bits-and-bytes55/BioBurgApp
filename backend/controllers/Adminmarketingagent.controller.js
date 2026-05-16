import MarketingAgent from "../models/MarketingAgent.model.js";
import EmployeeIdCard from "../models/employeeIdCards.js";
import MarketingAgentRole from "../models/MarketingAgentRole.model.js";
import cloudinary from "../config/cloudinary.js";

const agentListSelect = "-password -responses";

const populateHierarchy = (query) =>
  query
    .populate("reportsTo", "name email phone role assignedArea level")
    .populate("teamMembers", "name email phone role assignedArea level");

    const DEFAULT_AGENT_ROLES = [
  ["marketing_agent", "Marketing Agent"],
  ["senior_marketing_agent", "Senior Marketing Agent"],
  ["area_manager", "Area Manager"],
  ["regional_manager", "Regional Manager"],
  ["zonal_manager", "Zonal Manager"],
  ["marketing_head", "Marketing Head"],
];

const normalizeRoleValue = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, "_");

const formatRoleLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ensureDefaultRoles = async () => {
  await Promise.all(
    DEFAULT_AGENT_ROLES.map(([value, label]) =>
      MarketingAgentRole.updateOne(
        { value },
        { $setOnInsert: { value, label, isDefault: true } },
        { upsert: true }
      )
    )
  );
};

const formatAgentEmployeeId = (agent) => {
  const shortId = agent._id.toString().slice(-6).toUpperCase();
  return `MA-${shortId}`;
};

const ensureMarketingAgentIdCard = async (agent) => {
  const existingCard = await EmployeeIdCard.findOne({
    employeeRef: agent._id,
    sourceModel: "MarketingAgent",
    isActive: true,
  });

  if (existingCard) return existingCard;

  return EmployeeIdCard.create({
    employeeRef: agent._id,
    sourceModel: "MarketingAgent",
    employeeId: formatAgentEmployeeId(agent),
    name: agent.name,
    email: agent.email,
    phone: agent.phone,
    source: "Marketing Agent",
    designation: agent.role || "marketing_agent",
    department: "Marketing",
    location: agent.assignedArea || "India",
    issuedAt: new Date(),
    isActive: true,
  });
};

export const getAllAgents = async (req, res) => {
  try {
    const agents = await populateHierarchy(
      MarketingAgent.find().select(agentListSelect).sort({ createdAt: -1 })
    );

    res.json({ success: true, count: agents.length, agents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMarketingAgentRoles = async (req, res) => {
  try {
    await ensureDefaultRoles();

    const roles = await MarketingAgentRole.find()
      .sort({ isDefault: -1, label: 1 })
      .lean();

    res.json({ success: true, roles });
  } catch (err) {
    console.error("getMarketingAgentRoles error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createMarketingAgentRole = async (req, res) => {
  try {
    const value = normalizeRoleValue(req.body.value || req.body.label || "");

    if (!value) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const role = await MarketingAgentRole.findOneAndUpdate(
      { value },
      {
        $setOnInsert: {
          value,
          label: req.body.label || formatRoleLabel(value),
          isDefault: false,
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, role });
  } catch (err) {
    console.error("createMarketingAgentRole error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAgentById = async (req, res) => {
  try {
    const agent = await populateHierarchy(
      MarketingAgent.findById(req.params.id).select("-password")
    );

    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveAgent = async (req, res) => {
  try {
    const agent = await populateHierarchy(
      MarketingAgent.findByIdAndUpdate(
        req.params.id,
        { isApproved: true },
        { new: true }
      ).select("-password -jobHistory -responses")
    );

    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const idCard = await ensureMarketingAgentIdCard(agent);

    res.json({
      success: true,
      message: "Agent approved and ID pass generated",
      agent,
      idCard,
      loginAccess: {
        loginUrl: "/agent/login",
        email: agent.email,
        note: "Agent can now login using their registered email and password.",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const revokeAgent = async (req, res) => {
  try {
    const agent = await populateHierarchy(
      MarketingAgent.findByIdAndUpdate(
        req.params.id,
        { isApproved: false },
        { new: true }
      ).select("-password -jobHistory -responses")
    );

    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ success: true, message: "Agent approval revoked", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const blockAgentGps = async (req, res) => {
  try {
    const agent = await populateHierarchy(
      MarketingAgent.findByIdAndUpdate(
        req.params.id,
        { isGpsBlocked: true },
        { new: true }
      ).select("-password -jobHistory -responses")
    );

    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ success: true, message: "GPS blocked", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unblockAgentGps = async (req, res) => {
  try {
    const agent = await populateHierarchy(
      MarketingAgent.findByIdAndUpdate(
        req.params.id,
        { isGpsBlocked: false, gpsViolationCount: 0 },
        { new: true }
      ).select("-password -jobHistory -responses")
    );

    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({
      success: true,
      message: "GPS unblocked and violations reset",
      agent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMarketingAgentAccess = async (req, res) => {
  try {
    const { role, permissions, reportsTo, teamMembers, level } = req.body;

    const agent = await MarketingAgent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const normalizedTeamMembers = Array.isArray(teamMembers)
      ? teamMembers.filter((id) => id && id.toString() !== agent._id.toString())
      : [];

    const normalizedReportsTo =
      reportsTo && reportsTo.toString() !== agent._id.toString()
        ? reportsTo
        : null;

    const normalizedRole = role ? normalizeRoleValue(role) : "";

if (normalizedRole) {
  await MarketingAgentRole.findOneAndUpdate(
    { value: normalizedRole },
    {
      $setOnInsert: {
        value: normalizedRole,
        label: formatRoleLabel(normalizedRole),
        isDefault: false,
      },
    },
    { upsert: true }
  );

  agent.role = normalizedRole;
}

    agent.permissions = {
      ...(agent.permissions?.toObject?.() || agent.permissions || {}),
      ...(permissions || {}),
    };

    agent.reportsTo = normalizedReportsTo;
    agent.teamMembers = normalizedTeamMembers;
    agent.level = Number(level) || agent.level || 1;

    await agent.save();

    await MarketingAgent.updateMany(
      { reportsTo: agent._id },
      { $set: { reportsTo: null } }
    );

    if (normalizedTeamMembers.length > 0) {
      await MarketingAgent.updateMany(
        { _id: { $in: normalizedTeamMembers } },
        { $set: { reportsTo: agent._id } }
      );
    }

    await EmployeeIdCard.findOneAndUpdate(
      {
        employeeRef: agent._id,
        sourceModel: "MarketingAgent",
        isActive: true,
      },
      {
        designation: agent.role || "marketing_agent",
        location: agent.assignedArea || "India",
      }
    );

    const updatedAgent = await populateHierarchy(
      MarketingAgent.findById(agent._id).select("-password -jobHistory -responses")
    );

    res.json({
      success: true,
      message: "Agent access updated",
      agent: updatedAgent,
    });
  } catch (error) {
    console.error("updateMarketingAgentAccess error:", error);
    res.status(500).json({
      message: "Failed to update agent access",
      error: error.message,
    });
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

    res.json({
      success: true,
      agentName: agent.name,
      count: jobs.length,
      jobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

    if (requireLocation !== undefined) {
      update["jobStartRequirements.requireLocation"] = requireLocation;
    }

    if (requireImage !== undefined) {
      update["jobStartRequirements.requireImage"] = requireImage;
    }

    if (geofenceEnabled !== undefined) {
      update["geofence.enabled"] = geofenceEnabled;
    }

    if (geofenceLat !== undefined) {
      update["geofence.latitude"] = parseFloat(geofenceLat);
    }

    if (geofenceLng !== undefined) {
      update["geofence.longitude"] = parseFloat(geofenceLng);
    }

    if (geofenceRadiusKm !== undefined) {
      update["geofence.radiusKm"] = parseFloat(geofenceRadiusKm);
    }

    const agent = await populateHierarchy(
      MarketingAgent.findByIdAndUpdate(
        req.params.id,
        { $set: update },
        { new: true }
      ).select("-password -jobHistory -responses")
    );

    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ success: true, message: "Agent settings updated", agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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