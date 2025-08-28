import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  astrologer: { type: mongoose.Schema.Types.ObjectId, ref: "AstrologerProfile", required: true },
  type: { type: String, enum: ["call", "chat"], required: true },
  minutes: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true }, // in paise
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "paid", "completed", "cancelled"], default: "created" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String }
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
