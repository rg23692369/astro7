import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AstrologerProfile from "../models/AstrologerProfile.js";

const router = express.Router();

const signJWT = (user) => jwt.sign(
  { id: user._id, username: user.username, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// Signup (name + mobile only;)
router.post("/signup", async (req, res) => {
  try {
    const { username, Mobile, role = "user", password } = req.body;
    if (!username || !Mobile) return res.status(400).json({ error: "username and mobile are required" });
    const exists = await User.findOne({ $or: [{ username }, { Mobile }] });
    if (exists) return res.status(400).json({ error: "User already exists" });
    const hashed = await bcrypt.hash(password || (Mobile.slice(-6) || "123456"), 10);
    const user = await User.create({ username, Mobile, password: hashed, role });
    if (role === "astrologer") {
      await AstrologerProfile.create({
        user: user._id,
        displayName: username,
        bio: "",
        languages: [],
        expertise: [],
        perMinuteCallRate: 0,
        perMinuteChatRate: 0,
        isOnline: false,
        isBusy: false,
        approved: false
      });
    }
    const token = signJWT(user);
    res.json({ token, user: { id: user._id, username: user.username, mobile: user.mobile, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login (mobile or username + password)
router.post("/login", async (req, res) => {
  try {
    const { MobileOrUsername, password } = req.body;
    const query = /^\d+$/.test(MobileOrUsername)
      ? { mobile: MobileOrUsername }
      : { username: MobileOrUsername };
    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ error: "User not found" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = signJWT(user);
    res.json({ token, user: { id: user._id, username: user.username, mobile: user.mobile, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
