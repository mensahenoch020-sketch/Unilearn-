import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── SECURITY: Restrict CORS to your deployed domain ───────
// Set ALLOWED_ORIGIN in Railway environment variables
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      callback(new Error("CORS policy violation: origin not allowed"));
    },
    credentials: true,
  })
);

// ── BODY SIZE LIMITS ───────────────────────────────────────
app.use(express.json({ limit: "1mb" })); // API requests only; files go via Supabase Storage
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Supabase admin client ──────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Static files (built React app) ────────────────────────
app.use(express.static(path.join(__dirname, "dist")));

// ── HEALTH CHECK ───────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "UniLearn API running", timestamp: new Date().toISOString() });
});

// ── SIGNUP ─────────────────────────────────────────────────
app.post("/api/signup", async (req, res) => {
  const { name, email, password, role, matric, staff_id, faculty, department, level, semester } = req.body;

  // ── Input validation ──────────────────────────────────
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, and role are all required." });
  }
  if (!["student", "lecturer"].includes(role)) {
    return res.status(400).json({ error: "Role must be either 'student' or 'lecturer'." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (name.trim().length < 2) {
    return res.status(400).json({ error: "Please enter your full name." });
  }
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  console.log(`Signup attempt: ${email} (${role})`);

  try {
    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), role },
    });

    if (error) {
      console.error("Auth error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    // Insert profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      faculty: faculty || null,
      department: department || null,
      level: role === "student" ? level : null,
      semester: role === "student" ? semester : null,
      matric: role === "student" ? (matric || null) : null,
      staff_id: role === "lecturer" ? (staff_id || null) : null,
    });

    if (profileError) {
      console.error("Profile insert error:", profileError.message);
      // Auth user was created but profile failed — still return success
      // The profile can be created on next login via onAuthStateChange
    }

    console.log(`Signup success: ${email}`);
    res.json({ success: true, userId: data.user.id });
  } catch (err) {
    console.error("Signup catch error:", err.message);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

// ── DAILY.CO CALL ROOM CREATION ────────────────────────────
app.post("/api/call/create", async (req, res) => {
  const { callType } = req.body;
  if (!["video", "voice"].includes(callType)) {
    return res.status(400).json({ error: "callType must be 'video' or 'voice'." });
  }
  if (!process.env.DAILY_API_KEY) {
    return res.status(503).json({ error: "Video calling is not configured." });
  }
  try {
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          enable_chat: true,
          enable_knocking: false,
          start_video_off: callType === "voice",
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
      }),
    });
    const room = await response.json();
    if (!room.url) return res.status(500).json({ error: "Failed to create call room." });
    res.json({ url: room.url, name: room.name });
  } catch (err) {
    console.error("Call room error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── SPA FALLBACK ───────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`UniLearn server running on port ${PORT}`));
