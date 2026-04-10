import Employee from "../models/MarketingEmployee.js";
import JobApplication from "../models/JobApplication.js";

// Auto-generate employee ID
const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  return `EMP${String(count + 1).padStart(4, "0")}`;
};

// GET /api/employees — all employees with filters
export const getAllEmployees = async (req, res) => {
  try {
    const { status, role, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (role && role !== "all") filter.role = role;
    if (search) {
      filter.$or = [
        { fullName:   { $regex: search, $options: "i" } },
        { email:      { $regex: search, $options: "i" } },
        { phone:      { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { designation:{ $regex: search, $options: "i" } },
      ];
    }

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate("jobApplicationId", "applyingFor stage")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Employee.countDocuments(filter),
    ]);

    // Stats
    const allEmps = await Employee.find({}).lean();
    const stats = {
      total: allEmps.length,
      active: allEmps.filter((e) => e.status === "active").length,
      inactive: allEmps.filter((e) => e.status === "inactive").length,
      marketing: allEmps.filter((e) => e.role === "marketing_agent").length,
      delivery: allEmps.filter((e) => e.role === "delivery_agent").length,
    };

    res.json({ success: true, data: employees, total, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/employees/:id
export const getEmployeeById = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id)
      .populate("jobApplicationId")
      .lean();
    if (!emp) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: emp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/employees — manually add employee
export const createEmployee = async (req, res) => {
  try {
    const employeeId = await generateEmployeeId();
    const emp = await Employee.create({ ...req.body, employeeId, sourceType: "manual" });
    res.status(201).json({ success: true, data: emp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/employees/:id — edit role, status, any field
export const updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!emp) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: emp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/employees/:id
export const deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHiredApplications = async (req, res) => {
  try {
    const alreadyAdded = await Employee.find({ jobApplicationId: { $ne: null } })
      .select("jobApplicationId")
      .lean();
    const addedIds = alreadyAdded.map((e) => String(e.jobApplicationId));

    const hired = await JobApplication.find({ status: "hired" })
      .select("fullName email phone applyingFor city state joiningDate createdAt")
      .sort({ updatedAt: -1 })
      .lean();

    // Tag already imported ones
    const result = hired.map((h) => ({
      ...h,
      alreadyImported: addedIds.includes(String(h._id)),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const importFromApplication = async (req, res) => {
  try {
    const app = await JobApplication.findById(req.params.applicationId).lean();
    if (!app) return res.status(404).json({ success: false, message: "Application not found" });

    const existing = await Employee.findOne({ jobApplicationId: app._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already imported as employee" });
    }

    const employeeId = await generateEmployeeId();

    // Map applyingFor to role
    const roleMap = {
      "marketing agent": "marketing_agent",
      "delivery agent":  "delivery_agent",
      "sales manager":   "sales_manager",
      "hr":              "hr",
      "accountant":      "accountant",
      "operations":      "operations",
      "admin":           "admin",
      "intern":          "intern",
    };
    const mappedRole = roleMap[app.applyingFor?.toLowerCase()] || "other";

    const emp = await Employee.create({
      fullName:         app.fullName,
      email:            app.email,
      phone:            app.phone,
      city:             app.city || "",
      state:            app.state || "",
      role:             mappedRole,
      customRole:       mappedRole === "other" ? app.applyingFor : "",
      designation:      app.applyingFor || "",
      employeeId,
      sourceType:       "job_application",
      jobApplicationId: app._id,
      status:           "active",
    });

    res.status(201).json({ success: true, data: emp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};