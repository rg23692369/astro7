import express from "express";
import Razorpay from "razorpay";
import Booking from "../models/Booking.js";
import AstrologerProfile from "../models/AstrologerProfile.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Safe Razorpay init (optional)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized");
  } catch (e) {
    console.warn("⚠️ Razorpay init failed:", e?.message || e);
  }
} else {
  console.warn("⚠️ Razorpay keys missing. Payments will run in dummy mode.");
}

// Create booking + Razorpay order
router.post("/", authRequired(["user"]), async (req, res) => {
  try {
    const { astrologerId, type, minutes } = req.body;
    if (!astrologerId || !type || !minutes) {
      return res
        .status(400)
        .json({ error: "astrologerId, type, minutes required" });
    }

    const astro = await AstrologerProfile.findById(astrologerId);
    if (!astro) return res.status(404).json({ error: "Astrologer not found" });

    const amountPaise = Math.round(astro.perMinuteRate * minutes * 100);

    const booking = await Booking.create({
      user: req.user.id,
      astrologer: astro._id,
      type,
      minutes,
      amount: amountPaise,
      currency: "INR",
      status: "created",
    });

    let order;
    if (razorpay) {
      order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `booking_${booking._id}`,
        notes: { bookingId: booking._id.toString(), type },
      });
      booking.razorpayOrderId = order.id;
      await booking.save();
    } else {
      order = {
        id: "dummy_order_" + Date.now(),
        amount: amountPaise,
        currency: "INR",
        status: "created",
        testMode: true,
      };
    }

    res.json({ booking, order });
  } catch (e) {
    console.error("Booking error:", e);
    res.status(500).json({ error: "Booking failed" });
  }
});

// My bookings
router.get("/me", authRequired(), async (req, res) => {
  try {
    if (req.user.role === "user") {
      const list = await Booking.find({ user: req.user.id })
        .populate("astrologer")
        .sort({ createdAt: -1 });
      return res.json(list);
    }

    if (req.user.role === "astrologer") {
      const profiles = await AstrologerProfile.find({ user: req.user.id });
      if (!profiles.length) return res.json([]);
      const ids = profiles.map((p) => p._id);
      const list = await Booking.find({ astrologer: { $in: ids } })
        .populate("user")
        .sort({ createdAt: -1 });
      return res.json(list);
    }

    res.json([]);
  } catch (e) {
    console.error("Booking /me error:", e);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Alias for old frontend path
router.get("/mine", authRequired(), (req, res) => {
  res.redirect("/api/bookings/me");
});

export default router;
