import mongoose from 'mongoose';

const newLaunchSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  mrp: { // Original Price
    type: Number,
    required: true,
  },
  price: { // Selling Price
    type: Number,
    required: true,
  },
  imageUrl: { // Image ka URL
    type: String,
    required: true,
  },
}, { timestamps: true });

const NewLaunch = mongoose.model('NewLaunch', newLaunchSchema);
export default NewLaunch;