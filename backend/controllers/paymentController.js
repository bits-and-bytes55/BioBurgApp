import Razorpay from "razorpay";
import crypto from "crypto";

// ✅ Lazy init — only created when actually needed, not at server start
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not configured in .env");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * CREATE RAZORPAY ORDER
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.status(200).json(order);
  } catch (err) {
    console.error("RAZORPAY CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Could not create payment order" });
  }
};

/**
 * VERIFY RAZORPAY PAYMENT
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    res.status(200).json({ success: true, message: "Payment verified" });
  } catch (err) {
    console.error("RAZORPAY VERIFY ERROR:", err);
    res.status(500).json({ message: "Verification error" });
  }
};