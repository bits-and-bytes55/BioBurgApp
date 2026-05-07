import mongoose from "mongoose";

const targetSchema = new mongoose.Schema(
  {

    type: {
      type: String,
      enum: ["product", "area", "monthly", "option"],
      required: true,
    },

    product_name: String,
    segment: String,

    area_name: String,
    region: String,

    month_name: String,
    year: String,

    target: Number,
    achieved: Number,

    optionKey: String,   
    value: String,       
  },
  { timestamps: true }
);

export default mongoose.model("Target", targetSchema);