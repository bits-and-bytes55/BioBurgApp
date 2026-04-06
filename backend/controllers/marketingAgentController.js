import MarketingAgent from "../models/MarketingAgent.model.js";
import generateToken from "../utils/generateTokenMarketingAgent.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

/* ================= REGISTER ================= */
export const registerAgent = async (req, res) => {
  try {
    const { name, email, phone, password, assignedArea } = req.body;

    const exists = await MarketingAgent.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Agent already exists" });
    }

    const agent = await MarketingAgent.create({
      name,
      email,
      phone,
      password,
      assignedArea
    });

    res.status(201).json({
      success: true,
      token: generateToken(agent._id, agent.role),
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= LOGIN ================= */
export const loginAgent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const agent = await MarketingAgent.findOne({ email });
    if (!agent || !(await agent.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      success: true,
      token: generateToken(agent._id, agent.role),
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= PROFILE ================= */
export const getAgentProfile = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id).select("-password");
    res.json({ success: true, data: agent });
  } catch {
    res.status(500).json({ message: "Profile fetch failed" });
  }
};
const isFakeLocation = ({ accuracy, speed, distanceJumpKm }) => {
  if (accuracy > 100) return "Low accuracy";
  if (speed > 150) return "Unrealistic speed";
  if (distanceJumpKm > 2) return "Sudden jump";
  return null;
};

/* ▶ START JOB */
export const startJob = async (req, res) => {
  
  console.log("START JOB HIT");
  console.log("USER:", req.user);
  const agent = await MarketingAgent.findById(req.user.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });

  if (agent.isGpsBlocked)
    return res.status(403).json({ message: "GPS blocked" });

  if (agent.isOnJob)
    return res.status(400).json({ message: "Job already running" });

  const {
    latitude,
    longitude,
    locationAccuracy,
    state,
    district,
    area,
    address,
    startKmPhoto
  } = req.body;

  const fakeReason = isFakeLocation({ accuracy: locationAccuracy });
  if (fakeReason) {
    agent.gpsViolationCount++;
    if (agent.gpsViolationCount >= 3) agent.isGpsBlocked = true;
    await agent.save();
    return res.status(400).json({ message: fakeReason });
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
    startKmPhoto
  });

  await agent.save();
  res.json({ success: true, message: "Job started" });
};

export const getJobStatus = async (req, res) => {
  console.log('JOB STATUS HIT', req.user);

  const agent = await MarketingAgent.findById(req.user.id);

  if (!agent) {
    return res.status(404).json({ message: 'Agent not found' });
  }

  const currentJob =
    agent.jobHistory.length > 0
      ? agent.jobHistory[agent.jobHistory.length - 1]
      : null;

  res.json({
    success: true,
    isOnJob: agent.isOnJob,
    currentJob
  });
};

/* LIVE LOCATION */
export const updateLiveLocation = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id);
  if (!agent || !agent.isOnJob)
    return res.status(400).json({ message: "No active job" });

  const job = agent.jobHistory.at(-1);
  if (!job) return res.status(400).json({ message: "No job found" });

  const fakeReason = isFakeLocation(req.body);
  if (fakeReason) {
    job.jobStatus = "force_closed";
    agent.isOnJob = false;
    await agent.save();
    return res.status(403).json({ message: fakeReason });
  }

  job.routePath.push(req.body);
  agent.currentLocation = { ...req.body, updatedAt: new Date() };

  await agent.save();
  res.json({ success: true });
};

/* CLOSE JOB */
export const closeJob = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id);
  if (!agent || !agent.isOnJob)
    return res.status(400).json({ message: "No active job" });

  const job = agent.jobHistory.at(-1);
  if (!job) return res.status(400).json({ message: "No job found" });

  job.totalDistanceKm = Number(req.body.totalDistanceKm);
  job.closeKm = job.totalDistanceKm;
  job.closeKmPhoto = req.body.closeKmPhoto;
  job.jobStatus = "closed";
  job.jobEndTime = new Date();

  agent.isOnJob = false;
  await agent.save();

  res.json({ success: true, message: "Job closed" });
};

/*  FINAL SAVE */
export const saveJobDetails = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);

    if (!agent || agent.jobHistory.length === 0) {
      return res.status(400).json({ message: "No job found" });
    }

    //  last active job
    const job = agent.jobHistory[agent.jobHistory.length - 1];

    /* ===============================
       BUSINESS DETAILS
    =============================== */
    job.partner = req.body.partner || job.partner;
    if (!job.visits) job.visits = [];

job.visits.push({
  place: req.body.hospitalName,
  area: req.body.area,
  address: req.body.address,
  createdAt: new Date(),
});
    job.doctorName = req.body.doctorName || job.doctorName;
    job.degree = req.body.degree || job.degree;
    job.mobile = req.body.mobile || job.mobile;
    job.whatsapp = req.body.whatsapp || job.whatsapp;

    job.state = req.body.state || job.state;
    job.district = req.body.district || job.district;
    job.area = req.body.area || job.area;
    job.address = req.body.address || job.address;

    if (req.body.startKmPhoto?.url) {
      job.startKmPhoto = {
        url: req.body.startKmPhoto.url,
        public_id: req.body.startKmPhoto.public_id
      };
    }

    if (req.body.closeKmPhoto?.url) {
      job.closeKmPhoto = {
        url: req.body.closeKmPhoto.url,
        public_id: req.body.closeKmPhoto.public_id
      };
    }

    if (req.body.hospitalImage?.url) {
      job.hospitalImage = {
        url: req.body.hospitalImage.url,
        public_id: req.body.hospitalImage.public_id
      };
    }

    await agent.save();

    res.json({
      success: true,
      message: "Job details & images saved successfully"
    });
  } catch (error) {
    console.error("SAVE JOB DETAILS ERROR ", error);
    res.status(500).json({ message: "Failed to save job details" });
  }
};

export const getAgentProfileWithJob = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id).lean();

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

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
      isGpsBlocked: agent.isGpsBlocked
    },
    currentJob,
    currentLocation: agent.currentLocation
  });
};

export const getCompletedLeads = async (req, res) => {
  const agent = await MarketingAgent.findById(req.user.id);

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  const leads = agent.jobHistory
    .filter(j => j.jobStatus === "closed" || j.jobStatus === "force_closed")
    .map(j => ({
      id: j._id,
      jobStatus: j.jobStatus,
      jobStartTime: j.jobStartTime,
      jobEndTime: j.jobEndTime,
      totalDistanceKm: j.totalDistanceKm,

      // location
      state: j.state,
      district: j.district,
      area: j.area,
      address: j.address,

      // business
      partner: j.partner,
      hospitalName: j.hospitalName,
      doctorName: j.doctorName,
      degree: j.degree,
      mobile: j.mobile,
      whatsapp: j.whatsapp,

      // images
      startKmPhoto: j.startKmPhoto?.url || null,
      closeKmPhoto: j.closeKmPhoto?.url || null,
      hospitalImage: j.hospitalImage?.url || null
    }));

  res.json({
    success: true,
    count: leads.length,
    leads
  });
};

export const getAgentProducts = async (req, res) => {
  try {
    const products = await Product.find({
      statusActive: "active",
      statusAppear: "appear",
    }).select(`
      title
      brandName
      category
      shortDescription
      mrp
      price
      discountPercent
      offerText
      stock
      variants
      isOTC
      images
      primaryImageIndex
    `);

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Products load failed",
    });
  }
};

export const getJobHistory = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const jobs = [...agent.jobHistory]
      .sort((a, b) => new Date(b.jobStartTime) - new Date(a.jobStartTime))
      .map(j => ({
        _id: j._id,
        dutyDate: j.jobStartTime,
        dutyTime: j.jobStartTime
          ? new Date(j.jobStartTime).toLocaleTimeString("en-IN")
          : null,
        status: j.jobStatus === "closed" ? "completed"
               : j.jobStatus === "force_closed" ? "cancelled"
               : j.jobStatus === "started" ? "in-progress"
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
  } catch (error) {
    console.error("getJobHistory error:", error);
    res.status(500).json({ message: "Failed to fetch job history" });
  }
};


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