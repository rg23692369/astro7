import mongoose from "mongoose";

const astrologerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  displayName: { type: String, required: true },
  bio: { type: String, default: "" }, // biodata
  certificateUrl: { type: String, default: "" }, // uploaded image path
  languages: { type: [String], default: [] },
  expertise: { type: [String], default: [] },
  perMinuteCallRate: { type: Number, required: true, min: 0, default: 0 },
  perMinuteChatRate: { type: Number, required: true, min: 0, default: 0 },
  isOnline: { type: Boolean, default: false },
  isBusy: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5, default: 5 }
}, { timestamps: true });

export default mongoose.model("AstrologerProfile", astrologerProfileSchema);
