import mongoose from "mongoose";

const dealOfDaySchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const DealOfDay = mongoose.model("DealOfDay", dealOfDaySchema);
export default DealOfDay;