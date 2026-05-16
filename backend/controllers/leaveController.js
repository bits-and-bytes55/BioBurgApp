import mongoose from "mongoose";
import Leave from "../models/Leave.js";
import MarketingAgent from "../models/MarketingAgent.model.js";

const getAgentId = (req) => {
  const id =
    req.user?.id ||
    req.user?._id?.toString() ||
    req.user?.agentId ||
    req.user?.userId ||
    req.agent?.id;

  return id ? id.toString() : null;
};

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

    (currentAgent?.teamMembers || []).forEach((id) => {
      queue.push(id.toString());
    });
  }

  return [...visibleIds];
};

const getVisibleAgentObjectIds = async (agentId) => {
  const ids = await getVisibleAgentIds(agentId);
  return ids.map((id) => new mongoose.Types.ObjectId(id));
};

// POST /api/marketing-agent/leaves
export const submitLeave = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Agent authentication failed",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent id",
      });
    }

    const {
      leaveType,
      fromDate,
      toDate,
      reason,
      halfDay,
      halfDaySession,
      totalDays,
      name,
      enrollId,
      designation,
      workingAddress,
      level,
      ppaNo,
      aadharNo,
      panNo,
      employmentType,
      dateJoining,
      leaveAddress,
      leaveAddressType,
      leaveAddressContact,
      othersInfo,
      remarks,
      medicalCertificate,
      supportDocument,
    } = req.body;

    if (!fromDate) {
      return res.status(400).json({
        success: false,
        message: "From date is required",
      });
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    if (leaveType === "ML" && !medicalCertificate) {
      return res.status(400).json({
        success: false,
        message: "Medical certificate required for Medical Leave",
      });
    }

    if (["PL", "MAL"].includes(leaveType) && !supportDocument) {
      return res.status(400).json({
        success: false,
        message: "Supporting document required",
      });
    }

    const existingPendingLeave = await Leave.findOne({
      agentId,
      status: "pending",
    });

    if (existingPendingLeave) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending leave request",
      });
    }

    const isHalfDay = halfDay === true || halfDay === "true";
    const finalToDate = isHalfDay ? fromDate : toDate;

    const leave = await Leave.create({
      agentId: new mongoose.Types.ObjectId(agentId),
      name: name || "",
      enrollId: enrollId || "",
      designation: designation || "",
      workingAddress: workingAddress || "",
      level: level || "",
      ppaNo: ppaNo || "",
      aadharNo: aadharNo || "",
      panNo: panNo || "",
      employmentType: employmentType || "Permanent",
      dateJoining: dateJoining || null,
      leaveType: leaveType || "CL",
      halfDay: isHalfDay,
      halfDaySession: halfDaySession || "Forenoon",
      fromDate,
      toDate: finalToDate,
      totalDays: isHalfDay ? 0.5 : Number(totalDays || 1),
      leaveAddress: leaveAddress || "",
      leaveAddressType: leaveAddressType || "In-Station",
      leaveAddressContact: leaveAddressContact || "",
      reason,
      othersInfo: othersInfo || "",
      remarks: remarks || "",
      medicalCertificate: medicalCertificate || "",
      supportDocument: supportDocument || "",
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: leave,
    });
  } catch (err) {
    console.log("SUBMIT LEAVE ERROR =>", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// GET /api/marketing-agent/leaves
export const getMyLeaves = async (req, res) => {
  try {
    const viewerAgentId = getAgentId(req);

    if (!viewerAgentId) {
      return res.status(401).json({
        success: false,
        message: "Agent authentication failed",
      });
    }

    const visibleAgentIds = await getVisibleAgentObjectIds(viewerAgentId);
    const { agentId, status, month } = req.query;

    const filter = {
      agentId: { $in: visibleAgentIds },
    };

    if (agentId) {
      const requestedAgentId = new mongoose.Types.ObjectId(agentId);
      const canView = visibleAgentIds.some(
        (id) => id.toString() === requestedAgentId.toString()
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You cannot view this agent leaves",
        });
      }

      filter.agentId = requestedAgentId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      filter.fromDate = { $gte: start, $lte: end };
    }

    const leaves = await Leave.find(filter)
      .populate("agentId", "name email phone assignedArea role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: leaves });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// GET /api/marketing-agent/leaves/admin/all
export const getAllLeaves = async (req, res) => {
  try {
    const { status, agentId: qAgentId, month } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (qAgentId) filter.agentId = qAgentId;

    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      filter.fromDate = { $gte: start, $lte: end };
    }

    const leaves = await Leave.find(filter)
      .populate("agentId", "name email phone assignedArea role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: leaves });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// PATCH /api/marketing-agent/leaves/admin/:id
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave status",
      });
    }

    if (status === "rejected" && !adminRemark?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be actioned",
      });
    }

    leave.status = status;
    leave.adminRemark = adminRemark?.trim() || "";
    leave.approvedBy = req.user?.id || req.user?._id;
    leave.approvedAt = new Date();

    await leave.save();

    await leave.populate("agentId", "name email phone assignedArea role");

    return res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      data: leave,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

// DELETE /api/marketing-agent/leaves/:id
export const cancelLeave = async (req, res) => {
  try {
    const agentId = getAgentId(req);
    const { id } = req.params;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.agentId.toString() !== agentId) {
      return res.status(403).json({
        success: false,
        message: "Not authorised",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be cancelled",
      });
    }

    await leave.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Leave cancelled successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};
