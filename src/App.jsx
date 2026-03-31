import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const LIGHT = {
  primary:"#1B4332",primaryLight:"#2D6A4F",accent:"#F4A261",accentDark:"#E76F51",
  bg:"#F8F9FA",card:"#FFFFFF",text:"#1A1A2E",muted:"#6B7280",border:"#E5E7EB",
  success:"#10B981",warning:"#F59E0B",danger:"#EF4444",info:"#3B82F6",
  inputBg:"#fff",navBg:"#fff",headerBg:"#1B4332",headerText:"#fff",
};
const DARK = {
  primary:"#52B788",primaryLight:"#74C69D",accent:"#F4A261",accentDark:"#E76F51",
  bg:"#0F172A",card:"#1E293B",text:"#F1F5F9",muted:"#94A3B8",border:"#334155",
  success:"#10B981",warning:"#F59E0B",danger:"#EF4444",info:"#3B82F6",
  inputBg:"#1E293B",navBg:"#1E293B",headerBg:"#0F172A",headerText:"#F1F5F9",
};

function Login({ onLogin, C }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    onLogin(profile);
    setLoading(false);
  };

  const inp = { width:"100%", border:"1.5px solid #E5E7EB", borderRadius:10, padding:"11px 14px", fontSize:14, marginTop:6, boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#1B4332 0%,#2D6A4F 55%,#F4A261 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ marginBottom:32, textAlign:"center" }}>
          <div style={{ width:76, height:76, background:"#F4A261", borderRadius:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 12px" }}>🎓</div>
          <div style={{ color:"#fff", fontSize:28, fontWeight:"bold" }}>UniLearn</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:13, marginTop:4 }}>University of Ilorin</div>
        </div>
        <div style={{ background:"#fff", borderRadius:18, padding:26 }}>
          <div style={{ fontSize:20, fontWeight:"bold", marginBottom:20, color:"#1A1A2E" }}>Welcome Back</div>
          {error && <div style={{ background:"#FEE2E2", color:"#EF4444", padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:13 }}>{error}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#6B7280" }}>Email Address</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@unilorin.edu.ng" />
          </div>
          <div style={{ marginBottom:22 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#6B7280" }}>Password</label>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button onClick={handleLogin} disabled={loading} style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", width:"100%", fontSize:15, fontWeight:700, cursor:"pointer" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, C }) {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: ann } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5);
      const { data: crs } = await supabase.from("courses").select("*");
      setAnnouncements(ann || []);
      setCourses(crs || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign:"center", padding:40, color:C.muted }}>Loading...</div>;

  return (
    <div>
      <div style={{ background:`linear-gradient(120deg,${C.primary},${C.primaryLight})`, borderRadius:16, padding:20, marginBottom:18, color:"#fff" }}>
        <div style={{ fontSize:12, opacity:0.7 }}>Faculty of Communication & Information Sciences</div>
        <div style={{ fontSize:22, fontWeight:"bold", marginTop:3 }}>Hello, {user?.name?.split(" ")[0]} 👋</div>
        <div style={{ fontSize:12, opacity:0.65, marginTop:2 }}>{user?.role === "student" ? `Matric: ${user?.matric}` : user?.department}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {[
          { l:"Courses", v:courses.length, color:"#3B82F6", e:"📚" },
          { l:"Announcements", v:announcements.length, color:"#F59E0B", e:"📢" },
        ].map((s, i) => (
          <div key={i} style={{ background:C.card, borderRadius:12, padding:14, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:22 }}>{s.e}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, marginTop:4 }}>{s.v}</div>
            <div style={{ fontSize:11, color:C.muted }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:10, color:C.text }}>📣 Announcements</div>
      {announcements.length === 0 && <div style={{ color:C.muted, fontSize:13 }}>No announcements yet.</div>}
      {announcements.map(a => (
        <div key={a.id} style={{ background:C.card, borderRadius:12, padding:14, marginBottom:10, border:`1px solid ${C.border}` }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{a.title}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4, lineHeight:1.6 }}>{a.body}</div>
        </div>
      ))}
      <div style={{ fontSize:15, fontWeight:700, margin:"16px 0 10px", color:C.text }}>Your Courses</div>
      {courses.map(c => (
        <div key={c.id} style={{ background:C.card, borderRadius:12, padding:14, marginBottom:10, border:`1px solid ${C.border}` }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{c.code}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{c.title}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const C = dark ? DARK : LIGHT;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser(profile);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser(profile);
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTab("home");
  };

  const NAV = [
    { id:"home", l:"Home", e:"🏠" },
    { id:"courses", l:"Courses", e:"📚" },
    { id:"assignments", l:"Tasks", e:"📋" },
    { id:"more", l:"More", e:"⋯" },
  ];

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48 }}>🎓</div>
        <div style={{ color:C.muted, marginTop:12 }}>Loading UniLearn...</div>
      </div>
    </div>
  );

  if (!user) return <Login onLogin={setUser} C={C} />;

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:C.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", position:"relative" }}>
      <div style={{ background:C.headerBg, color:C.headerText, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:17, fontWeight:"bold" }}>UniLearn 🎓</div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={() => setDark(!dark)} style={{ background:"none", border:"none", color:C.headerText, cursor:"pointer", fontSize:18 }}>{dark ? "☀️" : "🌙"}</button>
          <button onClick={handleLogout} style={{ background:"none", border:"none", color:C.headerText, cursor:"pointer", fontSize:13 }}>Sign Out</button>
        </div>
      </div>
      <div style={{ padding:"16px 18px", paddingBottom:90 }}>
        {tab === "home" && <Dashboard user={user} C={C} />}
        {tab === "courses" && <div style={{ color:C.text, textAlign:"center", paddingTop:40 }}>Courses coming in next update</div>}
        {tab === "assignments" && <div style={{ color:C.text, textAlign:"center", paddingTop:40 }}>Assignments coming in next update</div>}
        {tab === "more" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:18, color:C.text }}>More</div>
            <div style={{ background:C.card, borderRadius:12, padding:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, color:C.text }}>{user?.name}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{user?.email}</div>
              <div style={{ fontSize:12, color:C.muted }}>{user?.role} · {user?.department}</div>
            </div>
            <button onClick={handleLogout} style={{ background:"#FEE2E2", color:"#EF4444", border:"none", borderRadius:12, padding:"14px 0", width:"100%", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:14 }}>Sign Out</button>
          </div>
        )}
      </div>
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.navBg, borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0" }}>
        {NAV.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"6px 0", color:tab === t.id ? C.primary : C.muted }}>
            <span style={{ fontSize:20 }}>{t.e}</span>
            <span style={{ fontSize:9, fontWeight:700 }}>{t.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
