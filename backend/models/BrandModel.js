import mongoose from 'mongoose';

// Ye model 'Trending' wale se bhi simple hai
const featuredBrandSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  imageUrl: { // Image ka URL
    type: String,
    required: true,
  },
}, { timestamps: true });

const FeaturedBrand = mongoose.model('BrandModel', featuredBrandSchema);
export default FeaturedBrand;