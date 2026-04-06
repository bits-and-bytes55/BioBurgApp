import mongoose from 'mongoose';

// Ye 'NewLaunch' model jaisa hi hai
const trendingProductSchema = new mongoose.Schema({
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

// Model ka naam 'TrendModel' aapne file mein rakha hai
const TrendingProduct = mongoose.model('TrendModel', trendingProductSchema);
export default TrendingProduct;