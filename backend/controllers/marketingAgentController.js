import MarketingAgent from "../models/MarketingAgent.model.js";
import EmployeeIdCard from "../models/employeeIdCards.js";
import Leave          from "../models/Leave.js";
import SalarySlip     from "../models/SalarySlip.js";
import generateToken from "../utils/generateTokenMarketingAgent.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinaryDelete.js";
import VisualAd from "../models/VisualAd.model.js";
import Staff from "../models/marketingstaff.js";
import mongoose from "mongoose";
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
  const agent = await MarketingAgent.findById(req.user.id); 
  if (!agent) return res.status(404).json({ message: 'Agent not found' });

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
    if (!updated) return res.status(404).json({ message: 'Agent not found' });
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

export const getWorkPerformance = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id).lean();
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const now            = new Date();
    const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek    = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const jobs      = agent.jobHistory || [];
    const responses = agent.responses  || [];

    //Date filters
    const filterByDate = (arr, dateField, from) =>
      arr.filter(item => new Date(item[dateField]) >= from);

    const todayJobs   = filterByDate(jobs,      "jobStartTime", startOfToday);
    const weekJobs    = filterByDate(jobs,      "jobStartTime", startOfWeek);
    const monthJobs   = filterByDate(jobs,      "jobStartTime", startOfMonth);
    const todayResp   = filterByDate(responses, "createdAt",    startOfToday);
    const weekResp    = filterByDate(responses, "createdAt",    startOfWeek);
    const monthResp   = filterByDate(responses, "createdAt",    startOfMonth);

    // Helpers 
    const sumDist     = arr => arr.reduce((s, j) => s + (j.totalDistanceKm || 0), 0);
    const countClosed = arr => arr.filter(j => j.jobStatus === "closed").length;
    const countOrders = arr => arr.filter(r => r.hasOrder).length;
    const countPositive = arr =>
      arr.filter(r => (r.responseStatus || "").toLowerCase().includes("positive")).length;

    const countProducts = arr =>
      arr.reduce((s, j) => s + (j.productsDetailed?.length || 0), 0);
    const countSamples  = arr =>
      arr.reduce((s, j) =>
        s + (j.samplesGiven?.reduce((ss, sg) => ss + (sg.quantity || 0), 0) || 0), 0);

    const safeRate = (done, total) =>
      total > 0 ? +((done / total) * 100).toFixed(1) : 0;

    //Overview
    const overview = {
      totalJobs        : jobs.length,
      completedJobs    : countClosed(jobs),
      totalDistanceKm  : +sumDist(jobs).toFixed(1),
      totalResponses   : responses.length,
      totalOrders      : countOrders(responses),
      totalProducts    : countProducts(jobs),
      totalSamples     : countSamples(jobs),
      gpsViolations    : agent.gpsViolationCount || 0,
      isGpsBlocked     : agent.isGpsBlocked || false,
      completionRate   : safeRate(countClosed(jobs), jobs.length),
    };

    //Today 
    const today = {
      jobs          : todayJobs.length,
      completed     : countClosed(todayJobs),
      distanceKm    : +sumDist(todayJobs).toFixed(1),
      responses     : todayResp.length,
      orders        : countOrders(todayResp),
      positiveResp  : countPositive(todayResp),
      productsDetailed: countProducts(todayJobs),
      samplesGiven  : countSamples(todayJobs),
      completionRate: safeRate(countClosed(todayJobs), todayJobs.length),
    };

    //This week
    const thisWeek = {
      jobs          : weekJobs.length,
      completed     : countClosed(weekJobs),
      distanceKm    : +sumDist(weekJobs).toFixed(1),
      responses     : weekResp.length,
      orders        : countOrders(weekResp),
      positiveResp  : countPositive(weekResp),
      productsDetailed: countProducts(weekJobs),
      samplesGiven  : countSamples(weekJobs),
      completionRate: safeRate(countClosed(weekJobs), weekJobs.length),
    };

    //This month 
    const monthCompleted = countClosed(monthJobs);
    const monthOrders    = countOrders(monthResp);

    const thisMonth = {
      jobs            : monthJobs.length,
      completed       : monthCompleted,
      distanceKm      : +sumDist(monthJobs).toFixed(1),
      responses       : monthResp.length,
      orders          : monthOrders,
      positiveResp    : countPositive(monthResp),
      productsDetailed: countProducts(monthJobs),
      samplesGiven    : countSamples(monthJobs),
      completionRate  : safeRate(monthCompleted, monthJobs.length),

      // Target vs Achievement (from agent.monthlyTarget set by admin)
      target: {
        jobs          : agent.monthlyTarget?.jobs          || 0,
        doctors       : agent.monthlyTarget?.doctors       || 0,
        orders        : agent.monthlyTarget?.orders        || 0,
        revenueTarget : agent.monthlyTarget?.revenueTarget || 0,
      },
      achievement: {
        jobsRate   : safeRate(monthJobs.length,   agent.monthlyTarget?.jobs   || 0),
        ordersRate : safeRate(monthOrders,         agent.monthlyTarget?.orders || 0),
        // unique doctor names visited this month
        doctorsCovered: [...new Set(
          monthJobs.map(j => j.doctorName).filter(Boolean)
        )].length,
        doctorsRate: safeRate(
          [...new Set(monthJobs.map(j => j.doctorName).filter(Boolean))].length,
          agent.monthlyTarget?.doctors || 0
        ),
      },
    };

    //Daily breakdown
    const dailyBreakdown = [];
    for (let i = 29; i >= 0; i--) {
      const d  = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];

      const dayJobs = jobs.filter(
        j => new Date(j.jobStartTime).toISOString().split("T")[0] === ds
      );
      const dayResp = responses.filter(
        r => new Date(r.createdAt).toISOString().split("T")[0] === ds
      );

      dailyBreakdown.push({
        date            : ds,
        label           : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        jobs            : dayJobs.length,
        completed       : countClosed(dayJobs),
        responses       : dayResp.length,
        orders          : countOrders(dayResp),
        distanceKm      : +sumDist(dayJobs).toFixed(1),
        productsDetailed: countProducts(dayJobs),
        samplesGiven    : countSamples(dayJobs),
      });
    }

    //Area-wise performance
    const areaMap = {};

    jobs.forEach(j => {
      const key = j.area || j.district || "Unknown";
      if (!areaMap[key]) {
        areaMap[key] = {
          jobs: 0, completed: 0, distance: 0,
          doctors: new Set(), products: 0, samples: 0,
        };
      }
      areaMap[key].jobs++;
      if (j.jobStatus === "closed") areaMap[key].completed++;
      areaMap[key].distance     += j.totalDistanceKm || 0;
      areaMap[key].products     += j.productsDetailed?.length || 0;
      areaMap[key].samples      += j.samplesGiven?.reduce((s, sg) => s + (sg.quantity || 0), 0) || 0;
      if (j.doctorName) areaMap[key].doctors.add(j.doctorName);
    });

    const areaPerformance = Object.entries(areaMap)
      .map(([area, d]) => ({
        area,
        jobs      : d.jobs,
        completed : d.completed,
        distanceKm: +d.distance.toFixed(1),
        doctors   : d.doctors.size,
        products  : d.products,
        samples   : d.samples,
        rate      : safeRate(d.completed, d.jobs),
      }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 10);

    //Partner type breakdown
    const partnerBreakdown = {};
    jobs.forEach(j => {
      const p = j.partner || "Other";
      partnerBreakdown[p] = (partnerBreakdown[p] || 0) + 1;
    });

    //Response status breakdown 
    const responseBreakdown = {};
    responses.forEach(r => {
      const s = r.responseStatus || "Unknown";
      responseBreakdown[s] = (responseBreakdown[s] || 0) + 1;
    });

    //Place type breakdown 
    const placeTypeBreakdown = {};
    responses.forEach(r => {
      const t = r.placeType || "Other";
      placeTypeBreakdown[t] = (placeTypeBreakdown[t] || 0) + 1;
    });

    //Products detailed breakdown
    const productDetailMap = {};
    jobs.forEach(j => {
      (j.productsDetailed || []).forEach(p => {
        productDetailMap[p.name] = (productDetailMap[p.name] || 0) + (p.quantity || 1);
      });
    });
    const topProducts = Object.entries(productDetailMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    //Sample stock summary 
    const sampleStockSummary = (agent.sampleStock || []).map(s => ({
      productName : s.productName,
      openingStock: s.openingStock,
      issued      : s.issued,
      balance     : s.balance,
    }));

    //Recent activity
    const recentActivity = [...jobs]
      .sort((a, b) => new Date(b.jobStartTime) - new Date(a.jobStartTime))
      .slice(0, 10)
      .map(j => ({
        _id             : j._id,
        date            : j.jobStartTime,
        area            : j.area || j.district || "-",
        partner         : j.partner || "-",
        status          : j.jobStatus,
        distanceKm      : j.totalDistanceKm || 0,
        doctorName      : j.doctorName      || null,
        hospitalName    : j.hospitalName    || null,
        productsDetailed: (j.productsDetailed || []).map(p => p.name),
        samplesGiven    : j.samplesGiven?.reduce((s, sg) => s + (sg.quantity || 0), 0) || 0,
        doctorFeedback  : j.doctorFeedback  || null,
        nextVisitDate   : j.nextVisitDate   || null,
        visitTime       : j.visitTime       || null,
      }));

    res.json({
      success: true,
      performance: {
        overview,
        today,
        thisWeek,
        thisMonth,
        dailyBreakdown,
        areaPerformance,
        partnerBreakdown,
        responseBreakdown,
        placeTypeBreakdown,
        topProducts,
        sampleStockSummary,
        recentActivity,
      },
    });

  } catch (error) {
    console.error("getWorkPerformance error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllMRPerformance = async (req, res) => {
  try {
    const agents = await MarketingAgent.find().lean();

    const data = agents.map(agent => {
      const jobs = agent.jobHistory || [];
      const responses = agent.responses || [];

      const totalJobs = jobs.length;
      const completed = jobs.filter(j => j.jobStatus === "closed").length;
      const orders = responses.filter(r => r.hasOrder).length;
      const totalResponses = responses.length;
      const distance = jobs.reduce((s, j) => s + (j.totalDistanceKm || 0), 0);

      return {
        name: agent.name,
        area: agent.assignedArea,
        jobs: totalJobs,
        orders,
        responses: totalResponses,
        distanceKm: distance,
        completionRate: totalJobs > 0 ? ((completed / totalJobs) * 100).toFixed(1) : 0,
      };
    });

    res.json({ success: true, mrs: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const {
      title, type, status, subject, message,
      recipients, scheduledAt, platform,
      imageBase64, imageMimeType,
      tags,
    } = req.body;
 
    if (!title?.trim() || !type || !message?.trim()) {
      return res.status(400).json({ message: "title, type, and message are required" });
    }
 
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    // Upload image to Cloudinary if base64 provided
    let uploadedImage = null;
    if (imageBase64) {
      try {
        const mime = imageMimeType || "image/jpeg";
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mime};base64,${imageBase64}`,
          { folder: "agent_campaigns", resource_type: "image" }
        );
        uploadedImage = {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        };
      } catch (uploadErr) {
        return res.status(500).json({ message: "Image upload failed: " + uploadErr.message });
      }
    }
 
    const campaign = {
      _id: new mongoose.Types.ObjectId(),
      title:       title.trim(),
      type,
      status:      status || "draft",
      subject:     subject || "",
      message:     message.trim(),
      recipients:  Array.isArray(recipients) ? recipients : [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      platform:    platform || "",
      image:       uploadedImage,
      tags:        Array.isArray(tags) ? tags : [],
      reach: 0, opens: 0, clicks: 0, conversions: 0,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
 
    agent.campaigns = agent.campaigns || [];
    agent.campaigns.push(campaign);
    await agent.save();
 
    res.status(201).json({ success: true, campaign });
  } catch (err) {
    console.error("createCampaign error:", err);
    res.status(500).json({ message: err.message });
  }
};
 
/* ── GET ALL CAMPAIGNS ── */
export const getCampaigns = async (req, res) => {
  try {
    const { type, status } = req.query;
    const agent = await MarketingAgent.findById(req.user.id).select("campaigns").lean();
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    let campaigns = agent.campaigns || [];
 
    if (type)   campaigns = campaigns.filter(c => c.type === type);
    if (status) campaigns = campaigns.filter(c => c.status === status);
 
    campaigns = campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 
    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── GET SINGLE CAMPAIGN ── */
export const getCampaign = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id).select("campaigns").lean();
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const campaign = (agent.campaigns || []).find(
      c => c._id.toString() === req.params.id
    );
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── UPDATE CAMPAIGN ── */
export const updateCampaign = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const idx = (agent.campaigns || []).findIndex(
      c => c._id.toString() === req.params.id
    );
    if (idx === -1) return res.status(404).json({ message: "Campaign not found" });
 
    const c = agent.campaigns[idx];
    if (c.status === "sent") {
      return res.status(400).json({ message: "Cannot edit a sent campaign" });
    }
 
    const { imageBase64, imageMimeType, removeImage } = req.body;
 
    // Handle image changes
    if (removeImage && c.image?.public_id) {
      try { await cloudinary.uploader.destroy(c.image.public_id); } catch (_) {}
      c.image = null;
    } else if (imageBase64) {
      // Delete old image
      if (c.image?.public_id) {
        try { await cloudinary.uploader.destroy(c.image.public_id); } catch (_) {}
      }
      // Upload new
      try {
        const mime = imageMimeType || "image/jpeg";
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mime};base64,${imageBase64}`,
          { folder: "agent_campaigns", resource_type: "image" }
        );
        c.image = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
      } catch (uploadErr) {
        return res.status(500).json({ message: "Image upload failed: " + uploadErr.message });
      }
    }
 
    // Update scalar fields
    const allowed = ["title","type","status","subject","message","platform","scheduledAt"];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) c[key] = req.body[key];
    });
    if (req.body.recipients !== undefined)
      c.recipients = Array.isArray(req.body.recipients) ? req.body.recipients : [];
    if (req.body.tags !== undefined)
      c.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    c.updatedAt = new Date();
 
    await agent.save();
    res.json({ success: true, campaign: agent.campaigns[idx] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── DELETE CAMPAIGN ── */
export const deleteCampaign = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const campaign = (agent.campaigns || []).find(
      c => c._id.toString() === req.params.id
    );
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    // Delete image from Cloudinary FIRST
    if (campaign.image?.public_id) {
      try {
        await cloudinary.uploader.destroy(campaign.image.public_id);
        console.log("Deleted campaign image from Cloudinary:", campaign.image.public_id);
      } catch (cloudErr) {
        console.error("Cloudinary delete error (non-fatal):", cloudErr.message);
      }
    }
 
    // Remove from DB
    agent.campaigns = agent.campaigns.filter(
      c => c._id.toString() !== req.params.id
    );
    await agent.save();
 
    res.json({ success: true, message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── SEND CAMPAIGN ── */
export const sendCampaign = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const campaign = (agent.campaigns || []).find(
      c => c._id.toString() === req.params.id
    );
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status === "sent") {
      return res.status(400).json({ message: "Already sent" });
    }
 
    // TODO: Integrate real send logic:
    // - Email: nodemailer / SendGrid / AWS SES
    // - WhatsApp: Twilio / WATI / Meta Cloud API
    // - SMS: Twilio / Fast2SMS
    // - Social: handled client-side (open platform URL)
 
    campaign.status  = "sent";
    campaign.sentAt  = new Date();
    campaign.reach   = (campaign.recipients || []).length;
    campaign.opens   = 0;
    campaign.clicks  = 0;
    campaign.conversions = 0;
 
    await agent.save();
    res.json({ success: true, message: "Campaign sent", campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── CAMPAIGN ROI / ANALYTICS ── */
export const getCampaignROI = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id).select("campaigns").lean();
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const campaigns = agent.campaigns || [];
 
    const byType = {};
    campaigns.forEach(c => {
      if (!byType[c.type]) byType[c.type] = {
        total: 0, sent: 0, reach: 0, opens: 0, clicks: 0, conversions: 0,
      };
      byType[c.type].total++;
      if (c.status === "sent") byType[c.type].sent++;
      byType[c.type].reach       += c.reach       || 0;
      byType[c.type].opens       += c.opens       || 0;
      byType[c.type].clicks      += c.clicks      || 0;
      byType[c.type].conversions += c.conversions || 0;
    });
 
    const roi = {
      total:            campaigns.length,
      sent:             campaigns.filter(c => c.status === "sent").length,
      scheduled:        campaigns.filter(c => c.status === "scheduled").length,
      draft:            campaigns.filter(c => c.status === "draft").length,
      totalReach:       campaigns.reduce((s, c) => s + (c.reach || 0), 0),
      totalOpens:       campaigns.reduce((s, c) => s + (c.opens || 0), 0),
      totalClicks:      campaigns.reduce((s, c) => s + (c.clicks || 0), 0),
      totalConversions: campaigns.reduce((s, c) => s + (c.conversions || 0), 0),
      byType,
    };
 
    res.json({ success: true, roi });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAgentVisualAds = async (req, res) => {
  try {
    const agentId = req.user.id;
 
    const ads = await VisualAd.find({
      isActive: true,
      $or: [
        { targetType: "all" },
        { targetType: "specific", targetAgents: agentId },
      ],
    })
      .select("-targetAgents -publicId -thumbnailPublicId") // don't expose Cloudinary internals to agent
      .sort({ createdAt: -1 })
      .lean();
 
    res.json({ success: true, count: ads.length, ads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
 
    const lead = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
 
    agent.leads = agent.leads || [];
    agent.leads.push(lead);
    await agent.save();
 
    const saved = agent.leads[agent.leads.length - 1];
    res.status(201).json({ success: true, lead: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── GET ALL LEADS ── */
export const getLeads = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id).select('leads').lean();
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
 
    const leads = (agent.leads || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── UPDATE LEAD ── */
export const updateLead = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
 
    const idx = (agent.leads || []).findIndex(
      l => l._id.toString() === req.params.id
    );
    if (idx === -1) return res.status(404).json({ message: 'Lead not found' });
 
    const allowed = [
      'placeName','placeType','placeTypeOther','address','city',
      'contactPerson','contactRole','contactRoleOther','phone','whatsapp','email',
      'stage','source','sourceOther','priority',
      'productInterest','productInterestOther','estimatedValue',
      'nextAction','nextActionOther','followUpDate','notes',
    ];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) agent.leads[idx][key] = req.body[key];
    });
    agent.leads[idx].updatedAt = new Date();
 
    await agent.save();
    res.json({ success: true, lead: agent.leads[idx] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── DELETE LEAD ── */
export const deleteLead = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
 
    const before = (agent.leads || []).length;
    agent.leads = agent.leads.filter(l => l._id.toString() !== req.params.id);
    if (agent.leads.length === before)
      return res.status(404).json({ message: 'Lead not found' });
 
    await agent.save();
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/* ── UPDATE LEAD STAGE ONLY ── */
export const updateLeadStage = async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ message: 'stage is required' });
 
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
 
    const lead = (agent.leads || []).find(l => l._id.toString() === req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
 
    lead.stage = stage;
    lead.updatedAt = new Date();
 
    // Push to stage history
    lead.stageHistory = lead.stageHistory || [];
    lead.stageHistory.push({ stage, changedAt: new Date() });
 
    await agent.save();
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllStaff = async (req, res) => {
  const data = await Staff.find();
  res.json(data);
};

// CREATE
export const createStaff = async (req, res) => {
  try {
    const count = await Staff.countDocuments();
    
    const newStaff = new Staff({
      ...req.body,
      empId: `EMP00${count + 1}`
    });

    const saved = await newStaff.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateStaff = async (req, res) => {
  try {
    const updated = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteStaff = async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSupportTicket = async (req, res) => {
  try {
    const {
      subject,
      category,
      priority,
      description,
      contactPhone,
      contactEmail,
      attachmentNote,
    } = req.body;
 
    // --- server-side validation ---
    if (!subject?.trim())       return res.status(400).json({ message: "Subject is required" });
    if (!category?.trim())      return res.status(400).json({ message: "Category is required" });
    if (!priority?.trim())      return res.status(400).json({ message: "Priority is required" });
    if (!description?.trim() || description.trim().length < 20)
      return res.status(400).json({ message: "Description must be at least 20 characters" });
    if (contactPhone && !/^\d{10,15}$/.test(contactPhone.replace(/\s/g, "")))
      return res.status(400).json({ message: "Invalid phone number" });
 
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    // Generate ticket ID
    const ticketCount = (agent.supportTickets || []).length + 1;
    const ticketId = `TKT-${String(ticketCount).padStart(4, "0")}-${Date.now().toString(36).toUpperCase()}`;
 
    const ticket = {
      ticketId,
      subject:        subject.trim(),
      category:       category.trim(),
      priority,
      description:    description.trim(),
      contactPhone:   contactPhone?.trim() || "",
      contactEmail:   contactEmail?.trim() || "",
      attachmentNote: attachmentNote?.trim() || "",
      status:         "open",
      adminReply:     "",
      createdAt:      new Date(),
      updatedAt:      new Date(),
    };
 
    agent.supportTickets = agent.supportTickets || [];
    agent.supportTickets.push(ticket);
    await agent.save();
 
    const saved = agent.supportTickets[agent.supportTickets.length - 1];
    res.status(201).json({ success: true, ticket: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/**
 * GET /api/marketing-agent/support/tickets
 * Get all support tickets for this agent
 */
export const getSupportTickets = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id)
      .select("supportTickets")
      .lean();
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const tickets = (agent.supportTickets || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/**
 * PATCH /api/marketing-agent/support/tickets/:id/status
 * Update ticket status (agent can close their own ticket)
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["open", "in_progress", "resolved", "closed"];
    if (!status || !allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });
 
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const ticket = (agent.supportTickets || []).find(
      (t) => t._id.toString() === req.params.id
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
 
    ticket.status    = status;
    ticket.updatedAt = new Date();
 
    await agent.save();
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
// ─────────────────────────────────────────
//  WORKFLOW STATUS
// ─────────────────────────────────────────
 
/**
 * POST /api/marketing-agent/support/workflows
 * Create a new workflow entry
 */
export const createWorkflow = async (req, res) => {
  try {
    const {
      title,
      workflowType,
      department,
      currentStage,
      priority,
      description,
      contactPerson,
      contactPhone,
      estimatedDays,
      dueDate,
      remarks,
    } = req.body;
 
    // --- server-side validation ---
    if (!title?.trim() || title.trim().length < 4)
      return res.status(400).json({ message: "Title must be at least 4 characters" });
    if (!workflowType?.trim())
      return res.status(400).json({ message: "Workflow type is required" });
    if (!department?.trim())
      return res.status(400).json({ message: "Department is required" });
    if (!currentStage?.trim())
      return res.status(400).json({ message: "Current stage is required" });
    if (!priority?.trim())
      return res.status(400).json({ message: "Priority is required" });
    if (!description?.trim() || description.trim().length < 15)
      return res.status(400).json({ message: "Description must be at least 15 characters" });
    if (contactPerson && /\d/.test(contactPerson))
      return res.status(400).json({ message: "Contact person name cannot contain numbers" });
    if (contactPhone && !/^\d{10,15}$/.test(contactPhone.replace(/\s/g, "")))
      return res.status(400).json({ message: "Invalid phone number" });
    if (estimatedDays && (isNaN(estimatedDays) || Number(estimatedDays) < 1))
      return res.status(400).json({ message: "Estimated days must be a positive number" });
 
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const workflow = {
      title:         title.trim(),
      workflowType:  workflowType.trim(),
      department:    department.trim(),
      currentStage:  currentStage.trim(),
      priority,
      description:   description.trim(),
      contactPerson: contactPerson?.trim() || "",
      contactPhone:  contactPhone?.trim() || "",
      estimatedDays: estimatedDays ? Number(estimatedDays) : null,
      dueDate:       dueDate ? new Date(dueDate) : null,
      remarks:       remarks?.trim() || "",
      stageHistory: [
        {
          stage:     currentStage.trim(),
          note:      "Initial stage",
          changedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
 
    agent.workflows = agent.workflows || [];
    agent.workflows.push(workflow);
    await agent.save();
 
    const saved = agent.workflows[agent.workflows.length - 1];
    res.status(201).json({ success: true, workflow: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/**
 * GET /api/marketing-agent/support/workflows
 * Get all workflows for this agent
 */
export const getWorkflows = async (req, res) => {
  try {
    const agent = await MarketingAgent.findById(req.user.id)
      .select("workflows")
      .lean();
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const workflows = (agent.workflows || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ success: true, count: workflows.length, workflows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
/**
 * PATCH /api/marketing-agent/support/workflows/:id/stage
 * Update the stage of a workflow
 */
export const updateWorkflowStage = async (req, res) => {
  try {
    const { stage, note } = req.body;
 
    if (!stage?.trim())
      return res.status(400).json({ message: "Stage is required" });
 
    const agent = await MarketingAgent.findById(req.user.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
 
    const wf = (agent.workflows || []).find(
      (w) => w._id.toString() === req.params.id
    );
    if (!wf) return res.status(404).json({ message: "Workflow not found" });
 
    wf.currentStage = stage.trim();
    wf.updatedAt    = new Date();
 
    wf.stageHistory = wf.stageHistory || [];
    wf.stageHistory.push({
      stage:     stage.trim(),
      note:      note?.trim() || "",
      changedAt: new Date(),
    });
 
    await agent.save();
    res.json({ success: true, workflow: wf });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyIdCard = async (req, res) => {
  try {
    const card = await EmployeeIdCard.findOne({ employeeRef: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (!card) return res.status(404).json({ message: "No ID card issued yet" });
    res.json({ card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ agentRef: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate)
      return res.status(400).json({ message: "fromDate and toDate are required" });
    const leave = await Leave.create({
      agentRef:  req.user.id,
      leaveType: leaveType || "casual",
      fromDate,
      toDate,
      reason:    reason || "",
      status:    "pending",
    });
    res.status(201).json({ leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
export const getMySalarySlips = async (req, res) => {
  try {
    const slips = await SalarySlip.find({ agentRef: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ slips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
export const updateAgentProfile = async (req, res) => {
  try {
    const allowed = ["name", "phone", "city", "state", "address", "emergencyContact", "bio"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const agent = await MarketingAgent.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ data: agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 