import mongoose from "mongoose";

const ZoneSchema = new mongoose.Schema({
  name: String,
  pincodes: [String],
  status: { type: String, default: "ACTIVE" }
});

export default mongoose.model("Zone", ZoneSchema);
