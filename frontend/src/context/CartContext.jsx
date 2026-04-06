// src/context/CartContext.jsx
import { useEffect, useState } from "react";
import { addToCartAPI, getCartAPI, updateCartAPI, removeFromCartAPI } from "../api/cart.api";
import toast from "react-hot-toast";
import { CartContext } from "./CartContextInstance";
import {
  isAnyUserLoggedIn,
  getGuestCart,
  saveGuestCart,
  clearGuestCart,
  showCartToast,
} from "./cartHelpers";

// ─── Guest item builder ───────────────────────────────────────────────────────
const buildGuestItem = (product, quantity = 1, variant = null) => {
  const productId = typeof product === "string" ? product : product?._id;
  const name      = typeof product === "object"
    ? (product.brandName || product.name || "Item") : "Item";
  const image     = typeof product === "object"
    ? (product.images?.[0]?.url || "") : "";

  const isBundle    = variant?.isBundleItem === true;
  const discountPct = (!isBundle && typeof product === "object")
    ? (product.rolePrice?.discountPercent || 0) : 0;
  const rawPrice    = variant?.price
    ? parseFloat(variant.price)
    : (typeof product === "object"
        ? parseFloat(product.rolePrice?.finalRate || product.mrp || 0) : 0);
  const price = (!isBundle && variant?.price && discountPct > 0)
    ? parseFloat((rawPrice * (1 - discountPct / 100)).toFixed(2))
    : rawPrice;
  const mrp = isBundle ? rawPrice
    : variant?.price ? rawPrice
    : (typeof product === "object" ? parseFloat(product.mrp || rawPrice) : rawPrice);
  const gstRate    = typeof product === "object" ? parseFloat(product.gst_igst || 0) : 0;
  const variantName = isBundle
    ? (variant.name || "Bundle")
    : (variant?.name || (variant?.attributes ? JSON.stringify(variant.attributes) : null));
  const bundleData = isBundle
    ? { isBundleItem: true, bundleProducts: variant.bundleProducts || [] }
    : null;

  return { productId, name, image, price, mrp, gstRate, variantName, bundleData, quantity, variant: variant || null };
};

const addToGuestCartLocal = (product, quantity = 1, variant = null) => {
  const cart = getGuestCart();
  const item = buildGuestItem(product, quantity, variant);
  const idx  = cart.items.findIndex(i =>
    (typeof i.productId === "object" ? i.productId._id : i.productId) ===
    (typeof item.productId === "object" ? item.productId._id : item.productId) &&
    (i.variantName || null) === (item.variantName || null)
  );
  if (idx >= 0) {
    cart.items[idx].quantity += quantity;
  } else {
    cart.items.push(item);
  }
  cart.totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);
  cart.totalPrice = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  saveGuestCart(cart);
  return cart;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [cart,    setCart]    = useState(null);
  const [loading, setLoading] = useState(false);

  // ── fetchCart ──────────────────────────────────────────────────────────────
  // KEY FIX: use isAnyUserLoggedIn() so vendor/hospital sessions fetch from
  // the server instead of falling back to the local guest cart.
  const fetchCart = async () => {
    if (!isAnyUserLoggedIn()) {
      setCart(getGuestCart());
      return;
    }
    try {
      const res = await getCartAPI();
      setCart(res.data.cart);
    } catch {
      setCart(null);
    }
  };

  // ── syncGuestCartToServer ──────────────────────────────────────────────────
  // Also uses isAnyUserLoggedIn() so vendors can sync guest items on login.
  const syncGuestCartToServer = async () => {
    if (!isAnyUserLoggedIn()) return;
    const guestCart = getGuestCart();
    if (!guestCart.items?.length) return;
    try {
      for (const item of guestCart.items) {
        const productId = typeof item.productId === "object"
          ? item.productId._id : item.productId;
        await addToCartAPI({
          productId,
          quantity     : item.quantity,
          priceAtAdded : item.price,
          gstRate      : item.gstRate || 0,
          variantName  : item.variantName || null,
          bundleData   : item.bundleData  || null,
        });
      }
      clearGuestCart();
      await fetchCart();
      toast.success("Your cart has been saved!");
    } catch (err) {
      console.error("Guest cart sync failed:", err);
    }
  };

  // ── addToCart ──────────────────────────────────────────────────────────────
  const addToCart = async (productOrId, quantity = 1, variant = null) => {
    setLoading(true);
    try {
      const isBundle = variant?.isBundleItem === true;
      const name     = isBundle
        ? (variant.name || "Bundle")
        : (typeof productOrId === "object"
            ? (productOrId.brandName || productOrId.name || "Item") : "Item");

      // Not logged in → local guest cart only
      if (!isAnyUserLoggedIn()) {
        const updated = addToGuestCartLocal(productOrId, quantity, variant);
        setCart({ ...updated });
        toast.success(`${name} added to cart!`);
        return;
      }

      const productId = typeof productOrId === "string"
        ? productOrId
        : productOrId?._id || productOrId?.productId?._id || productOrId?.productId;

      if (!productId) { toast.error("Invalid product"); return; }

      const discountPct  = (!isBundle && typeof productOrId === "object")
        ? (productOrId.rolePrice?.discountPercent || 0) : 0;
      const rawPrice     = variant?.price
        ? parseFloat(variant.price)
        : parseFloat(productOrId?.rolePrice?.finalRate || productOrId?.mrp || 0);
      const priceAtAdded = (!isBundle && variant?.price && discountPct > 0)
        ? parseFloat((rawPrice * (1 - discountPct / 100)).toFixed(2))
        : rawPrice;
      const gstRate      = parseFloat(productOrId?.gst_igst || 0);
      const variantName  = isBundle
        ? (variant.name || "Bundle")
        : (variant?.name || (variant?.attributes ? JSON.stringify(variant.attributes) : null));
      const bundleData   = isBundle
        ? { isBundleItem: true, bundleProducts: variant.bundleProducts || [] }
        : null;

      await addToCartAPI({ productId, quantity, priceAtAdded, gstRate, variantName, bundleData });
      await fetchCart();
      toast.success(`${name} added to cart!`);
    } catch (err) {
      console.error("addToCart error:", err);
      const msg = err?.response?.data?.message || "Failed to add to cart";
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("authorized")) {
        const updated = addToGuestCartLocal(productOrId, quantity, variant);
        setCart({ ...updated });
        toast.success("Added to cart!");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── updateQuantity ─────────────────────────────────────────────────────────
  const updateQuantity = async (productId, quantity, variantName = null) => {
    // Not logged in → update local guest cart
    if (!isAnyUserLoggedIn()) {
      const guestCart = getGuestCart();
      const idx = guestCart.items.findIndex(i =>
        (typeof i.productId === "object" ? i.productId._id : i.productId) === productId &&
        (i.variantName || null) === (variantName || null)
      );
      if (idx >= 0) {
        if (quantity <= 0) guestCart.items.splice(idx, 1);
        else guestCart.items[idx].quantity = quantity;
        guestCart.totalItems = guestCart.items.reduce((s, i) => s + i.quantity, 0);
        guestCart.totalPrice = guestCart.items.reduce((s, i) => s + i.price * i.quantity, 0);
        saveGuestCart(guestCart);
        setCart({ ...guestCart });
      }
      return;
    }
    // Logged in (any portal) → call API
    try {
      await updateCartAPI({ productId, quantity, variantName: variantName || null });
      fetchCart();
    } catch {
      toast.error("Update failed");
    }
  };

  // ── removeItem ─────────────────────────────────────────────────────────────
  const removeItem = async (productId, variantName = null) => {
    if (!isAnyUserLoggedIn()) {
      const guestCart = getGuestCart();
      guestCart.items = guestCart.items.filter(i =>
        !((typeof i.productId === "object" ? i.productId._id : i.productId) === productId &&
          (i.variantName || null) === (variantName || null))
      );
      guestCart.totalItems = guestCart.items.reduce((s, i) => s + i.quantity, 0);
      guestCart.totalPrice = guestCart.items.reduce((s, i) => s + i.price * i.quantity, 0);
      saveGuestCart(guestCart);
      setCart({ ...guestCart });
      return;
    }
    try {
      await removeFromCartAPI(productId, variantName);
      fetchCart();
    } catch {
      toast.error("Remove failed");
    }
  };

  const cartItemCount = cart?.totalItems
    || cart?.items?.reduce((s, i) => s + i.quantity, 0)
    || 0;

  useEffect(() => { fetchCart(); }, []);

  return (
    <CartContext.Provider value={{
      cart, loading, cartItemCount,
      addToCart, updateQuantity, removeItem,
      fetchCart, syncGuestCartToServer,
    }}>
      {children}
    </CartContext.Provider>
  );
};