import Leave from "../models/Leave.js";

const getAgentId = (req) =>
  req.user?._id || req.user?.id;

//
// SUBMIT LEAVE
//
export const submitLeave = async (req, res) => {
  try {
    const agentId = getAgentId(req);

    const {
      leaveType,
      fromDate,
      toDate,
      reason,
      halfDay,
      totalDays,
      medicalCertificate,
      supportDocument,
    } = req.body;

    //
    // REQUIRED
    //

    if (!fromDate || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "From date and reason are required",
      });
    }

    //
    // VALIDATIONS
    //

    if (
      leaveType === "ML" &&
      !medicalCertificate
    ) {
      return res.status(400).json({
        success: false,
        message: "Medical certificate required for Medical Leave",
      });
    }

    if (
      ["PL", "MAL"].includes(leaveType) &&
      !supportDocument
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Supporting document required for this leave type",
      });
    }

    //
    // CHECK EXISTING PENDING LEAVE
    //

    const existingPendingLeave = await Leave.findOne({
      agentId,
      status: "pending",
    });

    if (existingPendingLeave) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a leave request pending approval",
      });
    }

    //
    // CREATE LEAVE
    //

    const leave = await Leave.create({
      ...req.body,

      agentId,

      halfDay:
        halfDay === true ||
        halfDay === "true",

      totalDays:
        halfDay === true ||
        halfDay === "true"
          ? 0.5
          : Number(totalDays || 1),

      medicalCertificate:
        medicalCertificate || "",

      supportDocument:
        supportDocument || "",
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: leave,
    });

  } catch (err) {
    console.log("SUBMIT LEAVE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

//
// AGENT GET OWN LEAVES
//
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      agentId: getAgentId(req),
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: leaves,
    });

  } catch (err) {
    console.log("GET MY LEAVES ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

//
// ADMIN GET ALL LEAVES
//
export const getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (
      status &&
      status !== "all"
    ) {
      filter.status = status;
    }

    const leaves = await Leave.find(filter)
      .populate(
        "agentId",
        "name email phone assignedArea"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: leaves,
    });

  } catch (err) {
    console.log("GET ALL LEAVES ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

//
// ADMIN UPDATE STATUS
//
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      adminRemark,
    } = req.body;

    if (
      !["approved", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave status",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    leave.status = status;

    leave.adminRemark =
      adminRemark || "";

    leave.approvedBy =
      req.user?._id;

    leave.approvedAt =
      new Date();

    await leave.save();

    return res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      data: leave,
    });

  } catch (err) {
    console.log("UPDATE LEAVE STATUS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};