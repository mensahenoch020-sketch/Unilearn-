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
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    onLogin(profile);
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
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          matric: role === "student" ? matric : null,
          staff_id: role === "lecturer" ? staffId : null,
          faculty,
          department,
          level: role === "student" ? `${level} Level` : null,
          semester: role === "student" ? semester : null,
        }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); setLoading(false); return; }
      setMessage("Account created successfully! You can now sign in.");
      switchMode("login");
    } catch {
      setError("Something went wrong. Please try again.");
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
