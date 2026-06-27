import { useState } from "react";
import { supabase } from "../supabase.js";
import { FACULTIES, LEVELS, SEMESTERS } from "../data.js";
import Ic from "../components/Ic.jsx";

const inp = {
  width: "100%",
  border: "1.5px solid #E8E8E8",
  borderRadius: 12,
  padding: "13px 16px",
  fontSize: 14,
  background: "#F5F5F7",
  outline: "none",
  fontFamily: "Inter,sans-serif",
};

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [step, setStep] = useState(1);
  const [showHero, setShowHero] = useState(true);

  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState("student");
  const [matric, setMatric] = useState("");
  const [staffId, setStaffId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("400");
  const [semester, setSemester] = useState("Harmattan");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setMessage("");
    setStep(1);
  };

  // ── LOGIN ──────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    let tid;
    try {
      // 20-second timeout — prevents indefinite "Please wait…" hang on slow connections
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise((_, rej) => { tid = setTimeout(() => rej(new Error("timeout")), 20000); }),
      ]);
      clearTimeout(tid);
      const { data, error: e } = result;
      if (e) { setError(e.message); setLoading(false); return; }

      let { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      // Retry once — profile write may still be in-flight right after signup
      if (!profile) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: p2 } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        profile = p2;
      }
      // Self-repair: if signup was interrupted, rebuild the profile from auth metadata
      if (!profile) {
        const meta = data.user.user_metadata || {};
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name: meta.name || data.user.email,
          email: data.user.email,
          role: meta.role || "student",
        });
        const { data: p3 } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        profile = p3;
      }
      if (!profile) {
        setError("Could not load your profile. Please contact support.");
        setLoading(false);
        return;
      }
      onLogin(profile);
    } catch (err) {
      clearTimeout(tid);
      setError(
        err.message === "timeout"
          ? "Sign-in is taking too long. Please check your connection and try again."
          : "Sign-in failed. Please check your connection and try again."
      );
    }
    setLoading(false);
  };

  // ── SIGNUP ─────────────────────────────────────────────
  const handleSignup = async () => {
    if (!name || !email || !password) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (role === "student" && (!faculty || !department || !level))
      return setError("Please complete your academic details.");
    setLoading(true);
    setError("");
    setMessage("Creating your account…");
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: { data: { name: name.trim(), role } },
      });
      if (authErr) { setError(authErr.message); setLoading(false); return; }
      if (!data.user) { setError("Signup failed. Please try again."); setLoading(false); return; }

      // Write full profile — RLS policy allows this because signUp auto-authenticates
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        faculty: faculty || null,
        department: department || null,
        level: role === "student" ? `${level} Level` : null,
        semester: role === "student" ? semester : null,
        matric: role === "student" ? (matric || null) : null,
        staff_id: role === "lecturer" ? (staffId || null) : null,
      });

      // Fetch profile and log in directly — no need to go back to login screen
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      if (profile) {
        onLogin(profile);
      } else {
        setMessage("Account created! Please sign in.");
        switchMode("login");
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const nextStep = () => {
    if (!name || !email || !password) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setError("");
    setStep(2);
  };

  // ── FORGOT PASSWORD ────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) return setError("Please enter your email address.");
    setLoading(true);
    setError("");
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (e) return setError(e.message);
    setMessage("Password reset link sent! Check your email.");
  };

  const FEATURES = [
    { icon: "book",     color: "#F4A261", bg: "rgba(244,162,97,0.18)",  title: "Courses",    desc: "All your enrolled courses in one place" },
    { icon: "chart",    color: "#60A5FA", bg: "rgba(96,165,250,0.18)",  title: "Grades",     desc: "Track your academic performance live" },
    { icon: "calendar", color: "#34D399", bg: "rgba(52,211,153,0.18)",  title: "Timetable",  desc: "Never miss a class or lab session" },
    { icon: "bell",     color: "#F472B6", bg: "rgba(244,114,182,0.18)", title: "Notices",    desc: "Announcements delivered instantly" },
    { icon: "msg",      color: "#A78BFA", bg: "rgba(167,139,250,0.18)", title: "Messages",   desc: "Direct chat with your lecturer" },
    { icon: "clip",     color: "#FBBF24", bg: "rgba(251,191,36,0.18)",  title: "Assignments",desc: "Deadlines tracked, nothing missed" },
  ];

  if (showHero) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0D2B1E 0%, #1B4332 35%, #2D6A4F 70%, #1B4332 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "48px 22px 40px", fontFamily: "Inter,sans-serif", overflowY: "auto",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-ring { 0%{transform:scale(0.9);opacity:0.7} 100%{transform:scale(1.6);opacity:0} }
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.08)} 66%{transform:translate(-15px,25px) scale(0.95)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(1.05)} 66%{transform:translate(20px,-15px) scale(0.97)} }
        @keyframes s0{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes s1{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes s2{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes s3{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes s4{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes s5{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .hero-btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(244,162,97,0.55)!important}
        .hero-btn-secondary:hover{background:rgba(255,255,255,0.18)!important;transform:translateY(-2px)}
        .feature-card:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 12px 32px rgba(0,0,0,0.25)!important}
      `}</style>

      {/* Decorative background blobs */}
      <div style={{ position:"absolute", top:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(244,162,97,0.12) 0%,transparent 70%)", animation:"blob1 12s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-60, left:-60, width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,0.1) 0%,transparent 70%)", animation:"blob2 15s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"40%", left:-40, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.08) 0%,transparent 70%)", animation:"blob1 18s ease-in-out infinite reverse", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:400, textAlign:"center", position:"relative", zIndex:1 }}>

        {/* Logo with float + pulse ring */}
        <div style={{ animation:"s0 0.6s cubic-bezier(0.22,1,0.36,1) both", marginBottom:24 }}>
          <div style={{ position:"relative", width:90, height:90, margin:"0 auto" }}>
            <div style={{ position:"absolute", inset:0, borderRadius:26, background:"rgba(244,162,97,0.35)", animation:"pulse-ring 2.2s cubic-bezier(0.215,0.61,0.355,1) infinite" }} />
            <div style={{ position:"absolute", inset:0, borderRadius:26, background:"rgba(244,162,97,0.2)", animation:"pulse-ring 2.2s cubic-bezier(0.215,0.61,0.355,1) infinite 0.5s" }} />
            <div style={{ position:"relative", width:"100%", height:"100%", background:"linear-gradient(135deg,#F4A261 0%,#E8824A 100%)", borderRadius:26, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 16px 48px rgba(244,162,97,0.45)", animation:"float 3.5s ease-in-out infinite" }}>
              <Ic n="book" s={40} c="#fff" w={2} />
            </div>
          </div>
        </div>

        {/* Brand name */}
        <div style={{ animation:"s1 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both" }}>
          <div style={{ fontSize:46, fontWeight:900, color:"#fff", letterSpacing:-2.5, lineHeight:1, marginBottom:6 }}>UniLearn</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.1)", borderRadius:20, padding:"4px 14px", backdropFilter:"blur(12px)" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#34D399" }} />
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)", fontWeight:600, letterSpacing:0.5 }}>University of Ilorin</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ animation:"s2 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both", margin:"24px 0 8px" }}>
          <div style={{ fontSize:24, fontWeight:800, color:"#fff", letterSpacing:-0.8, lineHeight:1.3 }}>
            Your campus,<br />
            <span style={{ background:"linear-gradient(90deg,#F4A261,#FBBF24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>smarter.</span>
          </div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginTop:10, lineHeight:1.8 }}>
            Everything you need for university life
          </div>
        </div>

        {/* Feature cards 2-col grid */}
        <div style={{ animation:"s3 0.6s cubic-bezier(0.22,1,0.36,1) 0.32s both", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, margin:"28px 0 32px", textAlign:"left" }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card" style={{ background:"rgba(255,255,255,0.07)", backdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"14px 14px 12px", transition:"transform 0.2s, box-shadow 0.2s", cursor:"default" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:f.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                <Ic n={f.icon} s={17} c={f.color} w={2} />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:3 }}>{f.title}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div style={{ animation:"s4 0.6s cubic-bezier(0.22,1,0.36,1) 0.42s both", display:"flex", justifyContent:"center", gap:24, marginBottom:32 }}>
          {[["500+","Students"],["30+","Courses"],["Live","Updates"]].map(([num, lbl]) => (
            <div key={lbl} style={{ textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:900, color:"#F4A261" }}>{num}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:600, letterSpacing:0.5, marginTop:1 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ animation:"s5 0.6s cubic-bezier(0.22,1,0.36,1) 0.52s both", display:"flex", flexDirection:"column", gap:12 }}>
          <button
            className="hero-btn-primary"
            onClick={() => { setShowHero(false); setMode("login"); }}
            style={{ background:"linear-gradient(90deg,#F4A261 0%,#E8824A 50%,#F4A261 100%)", backgroundSize:"200% auto", color:"#fff", border:"none", borderRadius:16, padding:"18px 0", width:"100%", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"Inter,sans-serif", boxShadow:"0 10px 30px rgba(244,162,97,0.4)", letterSpacing:-0.3, transition:"transform 0.2s, box-shadow 0.2s", animation:"shimmer 3s linear infinite" }}>
            Sign In
          </button>
          <button
            className="hero-btn-secondary"
            onClick={() => { setShowHero(false); setMode("signup"); }}
            style={{ background:"rgba(255,255,255,0.09)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:16, padding:"16px 0", width:"100%", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif", backdropFilter:"blur(12px)", transition:"background 0.2s, transform 0.2s" }}>
            Create Account
          </button>
        </div>

        <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:28, letterSpacing:0.5 }}>
          UniLearn · University of Ilorin · 2025
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1B4332 0%, #2D6A4F 60%, #1B4332 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: "Inter,sans-serif",
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{ animation: "fadeIn 0.5s ease", width: "100%", maxWidth: 400, paddingBottom: 40 }}>
        {/* Back to landing */}
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
          <button onClick={() => setShowHero(true)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Ic n="chevronL" s={16} c="#fff" />
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>Back</span>
          </button>
        </div>
        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#F4A261",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Ic n="book" s={30} c="#fff" w={2} />
          </div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>UniLearn</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>University of Ilorin</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

          {/* ── TAB SWITCHER ── */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", background: "#F5F5F7", borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: mode === m ? "#1B4332" : "transparent",
                    color: mode === m ? "#fff" : "#888",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* ── ERROR / SUCCESS ── */}
          {error && (
            <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              {message}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Email</label>
                <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inp, paddingRight: 44 }}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <Ic n={showPw ? "eyeOff" : "eye"} s={18} c="#888" />
                  </button>
                </div>
              </div>
              <div style={{ textAlign: "right", marginBottom: 20 }}>
                <button
                  onClick={() => switchMode("forgot")}
                  style={{ background: "none", border: "none", color: "#1B4332", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  background: "#1B4332",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "15px 0",
                  width: "100%",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "Inter,sans-serif",
                }}
              >
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </>
          )}

          {/* ── SIGNUP STEP 1 ── */}
          {mode === "signup" && step === 1 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1B4332", marginBottom: 16 }}>Step 1 of 2 — Account Details</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Full Name</label>
                <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Email</label>
                <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inp, paddingRight: 44 }}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                    <Ic n={showPw ? "eyeOff" : "eye"} s={18} c="#888" />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 8 }}>I am a…</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["student", "lecturer"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: 12,
                        border: `2px solid ${role === r ? "#1B4332" : "#E8E8E8"}`,
                        background: role === r ? "#1B433210" : "#fff",
                        color: role === r ? "#1B4332" : "#888",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "Inter,sans-serif",
                      }}
                    >
                      {r === "student" ? "🎓 Student" : "👨‍🏫 Lecturer"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={nextStep}
                style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 12, padding: "15px 0", width: "100%", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
              >
                Next →
              </button>
            </>
          )}

          {/* ── SIGNUP STEP 2 ── */}
          {mode === "signup" && step === 2 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <button onClick={() => { setStep(1); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Ic n="chevronL" s={20} c="#1B4332" />
                </button>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1B4332" }}>Step 2 of 2 — Academic Details</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Faculty</label>
                <select style={inp} value={faculty} onChange={(e) => { setFaculty(e.target.value); setDepartment(""); }}>
                  <option value="">Select faculty</option>
                  {Object.keys(FACULTIES).map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {faculty && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Department</label>
                  <select style={inp} value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">Select department</option>
                    {FACULTIES[faculty].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              {role === "student" && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Matric Number</label>
                    <input style={inp} value={matric} onChange={(e) => setMatric(e.target.value)} placeholder="e.g. 20/52HA001" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Level</label>
                      <select style={inp} value={level} onChange={(e) => setLevel(e.target.value)}>
                        {LEVELS.map((l) => <option key={l} value={l}>{l} Level</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Semester</label>
                      <select style={inp} value={semester} onChange={(e) => setSemester(e.target.value)}>
                        {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
              {role === "lecturer" && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Staff ID</label>
                  <input style={inp} value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. UI/STF/001" />
                </div>
              )}
              <button
                onClick={handleSignup}
                disabled={loading}
                style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 12, padding: "15px 0", width: "100%", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif" }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Ic n="chevronL" s={20} c="#1B4332" />
                </button>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>Reset Password</div>
              </div>
              <p style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 20, lineHeight: 1.6 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", display: "block", marginBottom: 6 }}>Email</label>
                <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 12, padding: "15px 0", width: "100%", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif" }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
