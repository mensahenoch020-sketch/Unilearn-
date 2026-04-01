import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Serve React frontend
app.use(express.static(path.join(__dirname, "dist")));

// Create user
app.post("/api/signup", async (req, res) => {
  const { name, email, password, role, matric, department, level } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });
    if (error) return res.status(400).json({ error: error.message });

    await supabase.from("profiles").upsert({
      id: data.user.id,
      name,
      email,
      role,
      department: department || "Information Technology",
      level: level || (role === "student" ? "400 Level" : null),
      matric: role === "student" ? matric : null
    });

    res.json({ success: true, userId: data.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Daily.co call room
app.post("/api/call/create", async (req, res) => {
  const { callType } = req.body;
  try {
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          enable_chat: true,
          enable_knocking: false,
          start_video_off: callType === "voice",
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      })
    });
    const room = await response.json();
    res.json({ url: room.url, name: room.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All other routes serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
