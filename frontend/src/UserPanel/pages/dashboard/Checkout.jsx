import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { useCart } from "../../../context/useCart";
import { isAnyUserLoggedIn } from "../../../context/cartHelpers";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, fetchCart, syncGuestCartToServer } = useCart();

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [paymentMode, setPaymentMode] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const [step, setStep] = useState(1);

  const isLoggedIn = isAnyUserLoggedIn();

  useEffect(() => {
    if (isLoggedIn) {
      syncGuestCartToServer();
    }
  }, [isLoggedIn]);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const fetchPincodeData = useCallback(async (pin) => {
    if (pin.length !== 6) return;
    setPincodeLoading(true);
    setPincodeInfo(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].Status === "Success") {
        const po = data[0].PostOffice[0];
        setAddress((prev) => ({ ...prev, city: po.District, state: po.State }));
        setPincodeInfo(`${po.Name}, ${po.District}, ${po.State}`);
        toast.success("Location detected!");
      } else {
        setPincodeInfo("Invalid pincode");
        toast.error("Invalid pincode");
      }
    } catch {
      setPincodeInfo("Could not fetch pincode info");
    } finally {
      setPincodeLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (name === "pincode" && value.length === 6) fetchPincodeData(value);
  };

  const validateAddress = () =>
    Object.values(address).every((v) => v.trim() !== "");

  // ── Build guest items from localStorage safely ──
  const buildGuestItems = () => {
    try {
      const raw = localStorage.getItem("guest_cart");
      const guestCart = raw ? JSON.parse(raw) : { items: [] };
      return (guestCart.items || [])
        .map((item) => ({
          productId:
            typeof item.productId === "object"
              ? item.productId?._id
              : item.productId,
          quantity: item.quantity || 1,
          price: item.priceAtAdded || item.price || 0,
          priceAtAdded: item.priceAtAdded || item.price || 0,
          mrp: item.mrp || item.price || 0,
          gstRate: item.gstRate || 0,
          variantName: item.variantName || null,
          bundleData: item.bundleData || null,
          name: item.name || "Item",
          image: item.image || "",
        }))
        .filter((item) => !!item.productId); // drop malformed items
    } catch {
      return [];
    }
  };

  const placeOrder = async (mode, paymentId = null) => {
    try {
      setLoading(true);

      // ── Always use the same helper, never raw token check ──
      const isGuest = !isAnyUserLoggedIn();
      const guestItems = isGuest ? buildGuestItems() : [];

      if (isGuest && guestItems.length === 0) {
        toast.error("Your cart is empty. Please add items before checking out.");
        setLoading(false);
        return;
      }

      const payload = {
        address,
        paymentMode: mode,
        paymentId: paymentId || null,
        isGuest,
        // Only send guestItems when actually a guest
        ...(isGuest && { guestItems }),
      };

      console.log("Placing order:", { isGuest, guestItemCount: guestItems.length, payload });

      const res = await api.post("/api/orders/place", payload);

      toast.success("Order placed successfully! 🎉");

      // Clear guest cart only after confirmed success
      if (isGuest) {
        localStorage.removeItem("guest_cart");
      }

      // Navigate first, then refresh cart in background
      navigate(`/orders/success/${res.data.order._id}`);
      fetchCart(); // non-blocking
    } catch (err) {
      console.error("Place order error:", err);
      toast.error(err.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpay = async (orderTotal) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error("Payment SDK failed to load. Please try again.");
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.post("/api/payments/razorpay/create-order", {
        amount: orderTotal,
      });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "BioBurg",
        description: "Medicine Order Payment",
        order_id: data.id,
        handler: async (response) => {
          try {
            await api.post("/api/payments/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await placeOrder("ONLINE", response.razorpay_payment_id);
          } catch {
            toast.error("Payment verification failed");
            setLoading(false);
          }
        },
        prefill: { name: address.fullName, contact: address.phone },
        theme: { color: "#1976d2" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast("Payment cancelled", { icon: "⚠️" });
          },
        },
      };
      new window.Razorpay(options).open();
    } catch {
      toast.error("Could not initiate payment");
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      toast.error("Please fill all address fields");
      return;
    }
    if (paymentMode === "ONLINE") {
      setLoading(true);
      await handleRazorpay(total);
    } else {
      await placeOrder("COD");
    }
  };

  // ── Compute totals from whichever cart source is active ──
  const cartItems = (() => {
    if (isLoggedIn) return cart?.items || [];
    // Guest: read directly from localStorage for freshest data
    try {
      const raw = localStorage.getItem("guest_cart");
      return raw ? JSON.parse(raw).items || [] : [];
    } catch {
      return cart?.items || [];
    }
  })();

  if (!cartItems.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold">🛒 Your cart is empty</p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.priceAtAdded || item.price || item.productId?.rolePrice?.finalRate || 0;
    return sum + price * item.quantity;
  }, 0);

  const gstAmount = cartItems.reduce((sum, item) => {
    const price = item.priceAtAdded || item.price || item.productId?.rolePrice?.finalRate || 0;
    const gstRate = item.gstRate ?? parseFloat(item.productId?.gst_igst || 0);
    return sum + (price * item.quantity * gstRate) / 100;
  }, 0);

  const total = subtotal + gstAmount;

  const steps = ["Delivery Address", "Payment Method", "Review & Place Order"];

  return (
    <div className="bg-gray-100 min-h-screen py-6 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Guest banner */}
        {!isLoggedIn && (
          <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-800">You're checking out as a guest</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Sign Up to create Account or You can place the order now — no account needed!
              </p>
            </div>
            <button
              onClick={() =>
                navigate("/userlogin", {
                  state: { redirectTo: "/checkout", message: "Login to checkout faster & track your orders!" },
                })
              }
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Login / Sign Up
            </button>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 gap-0">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    step > i + 1
                      ? "bg-green-500 border-green-500 text-white"
                      : step === i + 1
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium hidden sm:block ${step === i + 1 ? "text-blue-600" : "text-gray-400"}`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-16 sm:w-24 mx-1 mb-4 transition-all ${step > i + 1 ? "bg-green-500" : "bg-gray-300"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-4">

            {/* STEP 1: ADDRESS */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden transition-all">
              <div
                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${step === 1 ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                onClick={() => step > 1 && setStep(1)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step > 1 ? "bg-green-500 text-white" : step === 1 ? "bg-white text-blue-600" : "bg-gray-200 text-gray-500"}`}>
                    {step > 1 ? "✓" : "1"}
                  </span>
                  <span className="font-semibold text-base">Delivery Address</span>
                </div>
                {step > 1 && <span className="text-sm underline cursor-pointer text-blue-600">Change</span>}
              </div>

              {step > 1 && (
                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 border-t">
                  📍 {address.fullName} — {address.addressLine}, {address.city}, {address.state} - {address.pincode}
                </div>
              )}

              {step === 1 && (
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                      <input name="fullName" value={address.fullName} onChange={handleChange} placeholder="Enter your full name"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Phone *</label>
                      <input name="phone" value={address.phone} onChange={handleChange} placeholder="10-digit mobile number"
                        maxLength={10} type="tel"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Address *</label>
                    <textarea name="addressLine" value={address.addressLine} onChange={handleChange}
                      placeholder="House No., Street, Area, Landmark" rows={2}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Pincode *</label>
                      <div className="relative">
                        <input name="pincode" value={address.pincode} onChange={handleChange}
                          placeholder="6-digit pincode" maxLength={6} type="tel"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {pincodeLoading && (
                          <div className="absolute right-3 top-3 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      {pincodeInfo && (
                        <p className={`text-xs mt-1 ${pincodeInfo.startsWith("Invalid") || pincodeInfo.startsWith("Could") ? "text-red-500" : "text-green-600"}`}>
                          {pincodeInfo}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">City *</label>
                      <input name="city" value={address.city} onChange={handleChange} placeholder="Auto-filled by pincode"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">State *</label>
                      <input name="state" value={address.state} onChange={handleChange} placeholder="Auto-filled by pincode"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                    </div>
                  </div>
                  <button
                    onClick={() => { if (!validateAddress()) { toast.error("Please fill all fields"); return; } setStep(2); }}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors"
                  >
                    Deliver Here →
                  </button>
                </div>
              )}
            </div>

            {/* STEP 2: PAYMENT */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div
                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${step === 2 ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                onClick={() => step > 2 && setStep(2)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step > 2 ? "bg-green-500 text-white" : step === 2 ? "bg-white text-blue-600" : "bg-gray-200 text-gray-500"}`}>
                    {step > 2 ? "✓" : "2"}
                  </span>
                  <span className="font-semibold text-base">Payment Method</span>
                </div>
                {step > 2 && <span className="text-sm text-blue-600 underline cursor-pointer">Change</span>}
              </div>

              {step > 2 && (
                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 border-t">
                  {paymentMode === "COD" ? "Cash on Delivery" : "Online Payment (Razorpay)"}
                </div>
              )}

              {step === 2 && (
                <div className="px-6 py-5 space-y-3">
                  <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMode === "ONLINE" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" value="ONLINE" checked={paymentMode === "ONLINE"}
                      onChange={() => setPaymentMode("ONLINE")} className="mt-1 accent-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">Online Payment</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">UPI, Credit/Debit Card, Net Banking via Razorpay</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"].map((m) => (
                          <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border">{m}</span>
                        ))}
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMode === "COD" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" value="COD" checked={paymentMode === "COD"}
                      onChange={() => setPaymentMode("COD")} className="mt-1 accent-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-800">Cash on Delivery</div>
                      <p className="text-xs text-gray-500 mt-1">Pay with cash when your order arrives</p>
                    </div>
                  </label>

                  <button onClick={() => setStep(3)}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors">
                    Continue →
                  </button>
                </div>
              )}
            </div>

            {/* STEP 3: REVIEW */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className={`flex items-center gap-3 px-6 py-4 ${step === 3 ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 3 ? "bg-white text-blue-600" : "bg-gray-200 text-gray-500"}`}>3</span>
                <span className="font-semibold text-base">Review & Place Order</span>
              </div>

              {step === 3 && (
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-500 mb-4">Review your items before placing the order</p>
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item, i) => {
                      const name = item.productId?.brandName || item.productId?.title || item.productId?.genericName || item.name || "Product";
                      const image = item.productId?.images?.[0]?.url || item.image || "/no-image.png";
                      const price = item.priceAtAdded || item.price || item.productId?.rolePrice?.finalRate || 0;
                      const gstRate = item.gstRate ?? parseFloat(item.productId?.gst_igst || 0);
                      const variantLabel = item.variantName || item.variant?.name || null;
                      const itemTotal = price * item.quantity * (1 + gstRate / 100);
                      return (
                        <div key={i} className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl">
                          <img src={image} alt={name}
                            className="w-14 h-14 object-contain rounded-lg border bg-white p-1"
                            onError={(e) => { e.target.src = "/no-image.png"; }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                            {variantLabel && <p className="text-xs text-blue-600 font-medium">{variantLabel}</p>}
                            <p className="text-xs text-gray-500">Qty: {item.quantity}{gstRate > 0 ? ` · GST ${gstRate}%` : ""}</p>
                          </div>
                          <p className="font-bold text-gray-900 text-right">
                            ₹{itemTotal.toFixed(2)}
                            <span className="block text-xs font-normal text-gray-400">incl. GST</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-bold text-white text-base transition-all ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98] shadow-lg"}`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : paymentMode === "COD" ? "Place Order (COD)" : "Pay & Place Order"}
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-2">Secure & encrypted checkout</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border p-5 sticky top-20">
              <h3 className="font-bold text-gray-800 text-base mb-4 pb-3 border-b">
                Order Summary ({cartItems.length} item{cartItems.length > 1 ? "s" : ""})
              </h3>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item, i) => {
                  const name = item.productId?.brandName || item.productId?.title || item.name || "Product";
                  const image = item.productId?.images?.[0]?.url || item.image || "/no-image.png";
                  const price = item.priceAtAdded || item.price || item.productId?.rolePrice?.finalRate || 0;
                  const variantLabel = item.variantName || item.variant?.name || null;
                  return (
                    <div key={i} className="flex gap-2 items-center">
                      <img src={image} alt={name}
                        className="w-10 h-10 object-contain rounded border bg-gray-50 p-0.5 flex-shrink-0"
                        onError={(e) => { e.target.src = "/no-image.png"; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{name}</p>
                        {variantLabel && <p className="text-xs text-blue-500 truncate">{variantLabel}</p>}
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">₹{(price * item.quantity).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (excl. GST)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST</span>
                  <span>+₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment</span>
                  <span>{paymentMode === "COD" ? "Cash on Delivery" : "Online"}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base text-gray-900">
                  <span>Total (incl. GST)</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                You save with FREE delivery on this order!
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                Safe & Secure Payments
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}