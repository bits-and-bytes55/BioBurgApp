// models/HospitalDashboard.js
import mongoose from "mongoose";

const hospitalDashboardSchema = new mongoose.Schema(
  {
    hospitalId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Hospital",
      required: true,
      unique:   true,
      index:    true,
    },

    patients:      { type: [mongoose.Schema.Types.Mixed], default: [] },
    appointments:  { type: [mongoose.Schema.Types.Mixed], default: [] },
    doctors:       { type: [mongoose.Schema.Types.Mixed], default: [] },
    departments:   { type: [mongoose.Schema.Types.Mixed], default: [] },
    lab:           { type: [mongoose.Schema.Types.Mixed], default: [] },
    pharmacy:      { type: [mongoose.Schema.Types.Mixed], default: [] },
    billing:       { type: [mongoose.Schema.Types.Mixed], default: [] },
    inventory:     { type: [mongoose.Schema.Types.Mixed], default: [] },
    staff:         { type: [mongoose.Schema.Types.Mixed], default: [] },
    prescriptions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,  
    strict: false,    
  }
);

const HospitalDashboard = mongoose.model("HospitalDashboard", hospitalDashboardSchema);
export default HospitalDashboard;