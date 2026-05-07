import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  empId:       { type: String, unique: true },
  name:        { type: String, required: true },
  designation: String,
  department:  String,
  joiningDate: String,
  status: {
    type:    String,
    enum:    ["Active", "Inactive", "On Leave"],
    default: "Active",
  },
  salary: String,
}, { timestamps: true });

export default mongoose.model("Staff", staffSchema);