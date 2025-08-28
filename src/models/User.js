import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // display name
  Mobile: { type: Number, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "astrologer", "admin"], default: "user" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
