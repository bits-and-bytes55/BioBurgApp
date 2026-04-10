import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    // Core identity
    fullName:    { type: String, required: true },
    email:       { type: String, required: true },
    phone:       { type: String, required: true },
    photo:       { type: String, default: "" },

    // Role & Department
    role: {
      type: String,
      enum: [
        "marketing_agent", "delivery_agent", "sales_manager",
        "hr", "accountant", "operations", "admin", "intern", "other"
      ],
      required: true,
    },
    customRole:  { type: String, default: "" }, // used when role = "other"
    department:  { type: String, default: "" },
    designation: { type: String, default: "" },

    // Employment details
    employeeId:   { type: String, unique: true, sparse: true },
    joiningDate:  { type: Date },
    salary:       { type: Number, default: 0 },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern"],
      default: "full_time",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },

    // Source — hired from job application?
    sourceType: {
      type: String,
      enum: ["manual", "job_application"],
      default: "manual",
    },
    jobApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobApplication",
      default: null,
    },

    // Location
    city:  { type: String, default: "" },
    state: { type: String, default: "" },

    // Notes
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", EmployeeSchema);