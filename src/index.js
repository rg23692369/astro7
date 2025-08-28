import express from "express";
import aiRoutes from "./routes/ai.js";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

// Routes
import authRoutes from "./routes/auth.js";
import astrologerRoutes from "./routes/astrologers.js";
import bookingRoutes from "./routes/bookings.js";
import paymentRoutes from "./routes/payments.js";

// Load environment variables
dotenv.config();

const app = express();
app.use('/uploads', express.static('uploads'));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// ✅ Middleware
app.use(express.json());

// ✅ CORS setup (allow multiple client URLs if needed)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ✅ Health check route
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Astrotalk API" });
});

// ✅ Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/astrologers", astrologerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ Config checks
if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI/MONGODB_URI in .env");
  process.exit(1);
}

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠️ Razorpay keys missing → Payments will run in dummy mode.");
}

// ✅ Connect to MongoDB & start server
mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err?.message || err);
    process.exit(1);
  });

app.use("/api/ai", aiRoutes);
