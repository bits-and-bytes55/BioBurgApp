import User from "../models/User.js";
import Product from "../models/Product.js";

// ------------------------------------------------------------
// ADD TO WISHLIST
// ------------------------------------------------------------
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Avoid duplicate entries
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    return res.json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// REMOVE FROM WISHLIST
// ------------------------------------------------------------
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== productId.toString()
    );

    await user.save();

    return res.json({ message: "Product removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------
// GET ALL WISHLIST PRODUCTS (POPULATED)
// ------------------------------------------------------------
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("wishlist");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      message: "Wishlist products fetched",
      products: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
