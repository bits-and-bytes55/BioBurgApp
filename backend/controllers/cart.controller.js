import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const POPULATE_SELECT =
  "brandName title genericName genericCompositions images mrp stocks totalStocks stock gst_igst rateB2C rateHospital ratePharmacy rateVendor rateFranchise rateManufacturer";

const getAvailableStock = (product) =>
  product.totalStocks > 0 ? product.totalStocks
  : product.stocks > 0 ? product.stocks
  : product.stock || 0;

const getRolePrice = (product, role) => {
  switch (role) {
    case "hospital":     return product.rateHospital     || product.rateB2C;
    case "pharmacy":     return product.ratePharmacy     || product.rateB2C;
    case "vendor":       return product.rateVendor       || product.rateB2C;
    case "franchise":    return product.rateFranchise    || product.rateB2C;
    case "manufacturer": return product.rateManufacturer || product.rateB2C;
    default:             return product.rateB2C;
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, quantity, priceAtAdded: clientPrice, gstRate: clientGst, variantName, bundleData } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.statusActive && product.statusActive !== "active") {
      return res.status(403).json({ message: "Product inactive" });
    }

    const availableStock = getAvailableStock(product);
    const rolePrice      = getRolePrice(product, req.user?.role);
    const isBundle       = bundleData?.isBundleItem === true;

    const finalPrice =
      clientPrice && clientPrice > 0 && clientPrice <= (product.mrp || Infinity)
        ? clientPrice : rolePrice;

    const finalGst =
      clientGst != null && clientGst >= 0
        ? clientGst : parseFloat(product.gst_igst || 0);

    const vName = variantName && variantName.trim() ? variantName.trim() : null;

    let cartDoc = await Cart.findOne({ userId });

    const newItem = {
      productId,
      quantity,
      priceAtAdded: finalPrice,
      gstRate:      finalGst,
      variantName:  vName,
      bundleData:   bundleData || null,
    };

    if (!cartDoc) {
      cartDoc = await Cart.findOneAndUpdate(
        { userId },
        { $push: { items: newItem } },
        { new: true, upsert: true }
      );
    } else {
      const matchIndex = cartDoc.items.findIndex(
        (i) =>
          i.productId.toString() === productId.toString() &&
          (i.variantName || null) === vName
      );

      if (matchIndex > -1 && !isBundle) {
        const newQty = cartDoc.items[matchIndex].quantity + quantity;
        if (newQty > availableStock) {
          return res.status(400).json({ message: "Exceeds available stock" });
        }
        cartDoc = await Cart.findOneAndUpdate(
          { userId },
          {
            $set: {
              [`items.${matchIndex}.quantity`]:     newQty,
              [`items.${matchIndex}.priceAtAdded`]: finalPrice,
              [`items.${matchIndex}.gstRate`]:      finalGst,
            },
          },
          { new: true }
        );
      } else {
        // New item or bundle (bundles always push as new row)
        if (!isBundle && availableStock < quantity) {
          return res.status(400).json({ message: "Product unavailable" });
        }
        cartDoc = await Cart.findOneAndUpdate(
          { userId },
          { $push: { items: newItem } },
          { new: true }
        );
      }
    }

    await cartDoc.populate({ path: "items.productId", select: POPULATE_SELECT });
    res.json({ success: true, message: "Item added to cart", cart: cartDoc });
  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET CART
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: POPULATE_SELECT,
    });

    if (!cart) return res.status(200).json({ success: true, cart: { items: [] } });

    const validItems = cart.items.filter((item) => item.productId !== null);
    if (validItems.length !== cart.items.length) {
      await Cart.findOneAndUpdate({ userId }, { $set: { items: validItems } });
      cart.items = validItems;
    }

    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * UPDATE QUANTITY
 */
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity, variantName } = req.body;
    const userId = req.user._id || req.user.id;

    if (quantity <= 0) return res.status(400).json({ message: "Invalid quantity" });

    const product = await Product.findById(productId);
    if (!product) {
      const cart = await Cart.findOneAndUpdate(
        { userId }, { $pull: { items: { productId } } }, { new: true }
      ).populate({ path: "items.productId", select: POPULATE_SELECT });
      return res.json({ success: true, message: "Product removed", cart });
    }

    const availableStock = getAvailableStock(product);
    if (quantity > availableStock) {
      return res.status(400).json({ message: `Only ${availableStock} units available` });
    }

    const vName = variantName && variantName.trim() ? variantName.trim() : null;
    const cartDoc = await Cart.findOne({ userId });
    if (!cartDoc) return res.status(404).json({ message: "Cart not found" });

    const matchIndex = cartDoc.items.findIndex(
      (i) =>
        i.productId.toString() === productId.toString() &&
        (i.variantName || null) === vName
    );
    if (matchIndex === -1) return res.status(404).json({ message: "Item not found" });

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { [`items.${matchIndex}.quantity`]: quantity } },
      { new: true }
    ).populate({ path: "items.productId", select: POPULATE_SELECT });

    res.json({ success: true, cart });
  } catch (err) {
    console.error("UPDATE CART ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * REMOVE ITEM — matches exact productId + variantName
 */
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const variantName   = req.query.variantName || null;
    const userId        = req.user._id || req.user.id;

    const vName = variantName && variantName.trim() ? variantName.trim() : null;

    const cartDoc = await Cart.findOne({ userId });
    if (!cartDoc) return res.status(404).json({ message: "Cart not found" });

    const matchIndex = cartDoc.items.findIndex(
      (i) =>
        i.productId.toString() === productId.toString() &&
        (i.variantName || null) === vName
    );

    if (matchIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cartDoc.items.splice(matchIndex, 1);

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: cartDoc.items } },
      { new: true }
    ).populate({ path: "items.productId", select: POPULATE_SELECT });

    res.json({ success: true, cart });
  } catch (err) {
    console.error("REMOVE CART ITEM ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * CLEAR CART
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Cart.findOneAndDelete({ userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};