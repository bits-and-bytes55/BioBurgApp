// models/Party.js
import mongoose from "mongoose";

const partySchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true
  },

  name: { type: String, required: true },
  phone: String,
  address: String,
  city: String,
  type: {
    type: String,
    enum: ["Doctor", "Hospital", "Medical"]
  }
}, { timestamps: true });

export default mongoose.model("Party", partySchema);
