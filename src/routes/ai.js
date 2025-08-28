import express from "express";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// POST /api/ai/chat { message }
// Uses OpenAI if OPENAI_API_KEY is present; otherwise returns a dummy response.
router.post("/chat", authRequired(), async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "message is required" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Dummy response if no key; keeps .env unchanged
      return res.json({ reply: `You said: "${message}". (AI offline: set OPENAI_API_KEY to enable real responses)` });
    }

    // Minimal call using fetch to OpenAI Chat Completions (no extra deps)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful voice assistant for an astrology app." },
          { role: "user", content: message }
        ]
      })
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "OpenAI error: " + t });
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I have no response.";
    res.json({ reply });
  } catch (e) {
    console.error("AI chat error:", e);
    res.status(500).json({ error: "AI chat failed" });
  }
});

export default router;
