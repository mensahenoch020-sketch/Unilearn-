import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allow all origins — fine for a student project
app.use(cors());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(express.static(path.join(__dirname, "dist")));

app.get("/health", (req, res) => {
res.json({ status: "UniLearn API running", timestamp: new Date().toISOString() });
});

app.post("/api/signup", async (req, res) => {
const { name, email, password, role, matric, staff_id, faculty, department, level, semester } = req.body;

if (!name || !email || !password || !role) {
return res.status(400).json({ error: "name, email, password, and role are all required." });
}
if (!["student", "lecturer"].includes(role)) {
return res.status(400).json({ error: "Role must be either ‘student’ or ‘lecturer’." });
}
if (password.length < 6) {
return res.status(400).json({ error: "Password must be at least 6 characters." });
}

try {
  const { data, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role },
  });

  if (error) return res.status(400).json({ error: error.message });

  await supabase.from("profiles").upsert({
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

  res.json({ success: true, userId: data.user.id });

} catch (err) {
  console.error("Signup error:", err);
  res.status(500).json({ error: err?.message || "An unexpected error occurred. Please try again." });
}
});

app.post("/api/call/create", async (req, res) => {
const { callType } = req.body;
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
exp: Math.floor(Date.now() / 1000) + 3600,
},
}),
});
const room = await response.json();
if (!room.url) return res.status(500).json({ error: "Failed to create call room." });
res.json({ url: room.url, name: room.name });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`UniLearn server running on port ${PORT}`));
