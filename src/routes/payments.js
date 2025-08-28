import express from "express";
import crypto from "crypto";
import Booking from "../models/Booking.js";

const router = express.Router();

router.get('/status', (req, res) => {
  const configured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.json({ configured });
});


// ✅ Verify Razorpay Payment Signature
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Check if required fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

    // Recalculate HMAC using secret key
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Find booking linked to this order
    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Update booking as paid
    booking.status = "paid";
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    await booking.save();

    return res.json({
      success: true,
      message: "Payment verified successfully",
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
