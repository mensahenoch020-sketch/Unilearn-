import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(express.static(path.join(__dirname, "dist")));

app.get("/health", (req, res) => {
  res.json({ status: "UniLearn API running" });
});

app.post("/api/signup", async (req, res) => {
  const { name, email, password, role, matric, department, level } = req.body;
  console.log("Signup attempt:", { name, email, role });
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });
    console.log("Auth response:", JSON.stringify({ data, error }));
    if (error) return res.status(400).json({ error: error.message });

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      name,
      email,
      role,
      department: department || "Information Technology",
      level: level || (role === "student" ? "400 Level" : null),
      matric: role === "student" ? matric : null
    });
    console.log("Profile error:", JSON.stringify(profileError));

    res.json({ success: true, userId: data.user.id });
  } catch (err) {
    console.log("Catch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

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
    if (!response.ok) {
      return res.status(response.status).json({ error: room.error || "Failed to create room" });
    }
    res.json({ url: room.url, name: room.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
