import express from "express";
import fs from "fs";
import path from "path";
import AstrologerProfile from "../models/AstrologerProfile.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

/**
 * Get astrologers
 * Query: all=1 to include offline
 *        q=search
 */
router.get("/", async (req, res) => {
  try {
    const { all, q } = req.query;
    const filter = all ? {} : { isOnline: true };
    if (q) {
      filter.$or = [
        { displayName: { $regex: q, $options: "i" } },
        { expertise: { $regex: q, $options: "i" } },
        { languages: { $regex: q, $options: "i" } },
      ];
    }
    const list = await AstrologerProfile.find(filter).populate("user", "username role");
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single profile
router.get("/:id", async (req, res) => {
  const p = await AstrologerProfile.findById(req.params.id).populate("user","username role");
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

// Status only (for polling)
router.get("/:id/status", async (req, res) => {
  const p = await AstrologerProfile.findById(req.params.id).select("isOnline isBusy approved");
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

// Create/Update my profile
router.post("/me", authRequired(["astrologer"]), async (req, res) => {
  try {
    const { displayName, bio, languages = [], expertise = [], perMinuteCallRate = 0, perMinuteChatRate = 0, isOnline = false, isBusy = false } = req.body;
    const updated = await AstrologerProfile.findOneAndUpdate(
      { user: req.user.id },
      { displayName, bio, languages, expertise, perMinuteCallRate, perMinuteChatRate, isOnline, isBusy },
      { new: true, upsert: true }
    ).populate("user","username role");
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upload certificate (base64 data URL) from camera/photo
router.post("/me/certificate", authRequired(["astrologer"]), async (req, res) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return res.status(400).json({ error: "Invalid image" });
    const b64 = dataUrl.split(",")[1];
    const buf = Buffer.from(b64, "base64");
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `cert_${req.user.id}_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buf);
    const p = await AstrologerProfile.findOneAndUpdate({ user: req.user.id }, { certificateUrl: `/uploads/${filename}` }, { new: true });
    res.json({ ok: true, certificateUrl: p.certificateUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Toggle busy/online
router.post("/me/status", authRequired(["astrologer"]), async (req, res) => {
  const { isOnline, isBusy } = req.body;
  const p = await AstrologerProfile.findOneAndUpdate({ user: req.user.id }, { isOnline, isBusy }, { new: true });
  res.json(p);
});

// Admin approve
router.post("/admin/approve/:id", authRequired(["admin"]), async (req, res) => {
  const p = await AstrologerProfile.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
  res.json(p);
});

export default router;
