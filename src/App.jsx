import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const LIGHT = {
  primary:"#1B4332",primaryLight:"#2D6A4F",accent:"#F4A261",
  bg:"#F5F5F7",card:"#FFFFFF",text:"#1A1A1A",muted:"#6B6B6B",border:"#E8E8E8",
  success:"#10B981",warning:"#F59E0B",danger:"#EF4444",info:"#3B82F6",
  navBg:"#fff",headerBg:"#1B4332",headerText:"#fff",inputBg:"#F5F5F7"
};
const DARK = {
  primary:"#52B788",primaryLight:"#74C69D",accent:"#F4A261",
  bg:"#0A0A0A",card:"#1A1A1A",text:"#F5F5F7",muted:"#888",border:"#2A2A2A",
  success:"#10B981",warning:"#F59E0B",danger:"#EF4444",info:"#3B82F6",
  navBg:"#1A1A1A",headerBg:"#0A0A0A",headerText:"#F5F5F7",inputBg:"#1A1A1A"
};

const Icon = ({ name, size = 20, color = "currentColor", strokeWidth = 1.8 }) => {
  const icons = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
    more: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    chevronLeft: <polyline points="15 18 9 12 15 6"/>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>,
    file: <><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
    video: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.38 10a19.79 19.79 0 01-3.07-8.67A2 2 0 013.28 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 7.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>,
    mic: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    micOff: <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    videoOff: <><path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    phoneOff: <><path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.42 19.42 0 01-3.33-2.67m-2.67-3.34a19.79 19.79 0 01-3.07-8.63A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [matric, setMatric] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width:"100%", border:"1.5px solid #E8E8E8", borderRadius:12,
    padding:"13px 16px", fontSize:15, marginTop:8, boxSizing:"border-box",
    background:"#F5F5F7", color:"#1A1A1A", outline:"none", fontFamily:"Inter, sans-serif"
  };

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true); setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    onLogin(profile);
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!name || !email || !password) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, matric, department: "Information Technology", level: "400 Level" })
      });
      const result = await response.json();
      if (result.error) { setError(result.error); setLoading(false); return; }
      setMessage("Account created. You can now sign in.");
      setMode("login");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#1B4332", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ marginBottom:40, textAlign:"center" }}>
        <div style={{ width:64, height:64, background:"#F4A261", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <Icon name="book" size={32} color="#fff" />
        </div>
        <div style={{ color:"#fff", fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>UniLearn</div>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginTop:4 }}>University of Ilorin</div>
      </div>
      <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:400 }}>
        <div style={{ display:"flex", background:"#F5F5F7", borderRadius:12, padding:4, marginBottom:24 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:mode===m?"#1B4332":"transparent", color:mode===m?"#fff":"#6B6B6B", fontWeight:600, cursor:"pointer", fontSize:13, fontFamily:"Inter, sans-serif", transition:"all 0.2s" }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        {error && <div style={{ background:"#FEE2E2", color:"#EF4444", padding:"12px 16px", borderRadius:10, marginBottom:16, fontSize:13 }}>{error}</div>}
        {message && <div style={{ background:"#D1FAE5", color:"#10B981", padding:"12px 16px", borderRadius:10, marginBottom:16, fontSize:13 }}>{message}</div>}
        {mode === "signup" && (
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#6B6B6B" }}>Full Name</label>
            <input style={inp} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>
        )}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#6B6B6B" }}>Email</label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" />
        </div>
        <div style={{ marginBottom: mode === "signup" ? 16 : 24 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#6B6B6B" }}>Password</label>
          <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {mode === "signup" && (
          <>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#6B6B6B" }}>Role</label>
              <select style={inp} value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>
            {role === "student" && (
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"#6B6B6B" }}>Matric Number</label>
                <input style={inp} type="text" value={matric} onChange={e => setMatric(e.target.value)} placeholder="e.g. 21/52HL089" />
              </div>
            )}
          </>
        )}
        <button onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading}
          style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:12, padding:"15px 0", width:"100%", fontSize:15, fontWeight:700, cursor:"pointer", opacity:loading?0.7:1, fontFamily:"Inter, sans-serif" }}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user, C, setTab }) {
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

  if (loading) return <div style={{ textAlign:"center", padding:60, color:"#888" }}>Loading...</div>;

  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,#1B4332,#2D6A4F)`, borderRadius:20, padding:24, marginBottom:20, color:"#fff" }}>
        <div style={{ fontSize:12, opacity:0.6, fontWeight:500, letterSpacing:0.3 }}>FACULTY OF COMMUNICATION & INFORMATION SCIENCES</div>
        <div style={{ fontSize:24, fontWeight:800, marginTop:8, letterSpacing:-0.5 }}>Hello, {user?.name?.split(" ")[0]} 👋</div>
        <div style={{ fontSize:13, opacity:0.7, marginTop:4 }}>{user?.role === "student" ? `Matric: ${user?.matric}` : user?.department}</div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:600 }}>{courses.length} Courses</div>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:600 }}>400 Level</div>
        </div>
      </div>

      {announcements.length > 0 && (
        <>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.muted, letterSpacing:0.5 }}>ANNOUNCEMENTS</div>
          {announcements.map(a => (
            <div key={a.id} style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{a.title}</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:6, lineHeight:1.6 }}>{a.body}</div>
            </div>
          ))}
        </>
      )}

      <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.muted, letterSpacing:0.5, marginTop:20 }}>YOUR COURSES</div>
      {courses.length === 0 && <div style={{ color:C.muted, fontSize:14, padding:"30px 0", textAlign:"center" }}>No courses yet.</div>}
      {courses.map(c => (
        <div key={c.id} onClick={() => setTab("courses")} style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
          <div style={{ width:44, height:44, background:c.color+"18", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name="book" size={20} color={c.color} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{c.code}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{c.title}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ background:c.color+"18", color:c.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{c.units}u</span>
            <Icon name="chevronRight" size={16} color={C.muted} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Courses({ user, C }) {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("materials");
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => {
      setCourses(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadData();
  }, [selected, activeTab]);

  const loadData = async () => {
    if (activeTab === "materials") {
      const { data } = await supabase.from("materials").select("*").eq("course_id", selected.id).order("created_at", { ascending: false });
      setMaterials(data || []);
    }
    if (activeTab === "assignments") {
      const { data } = await supabase.from("assignments").select("*").eq("course_id", selected.id).order("due_date");
      setAssignments(data || []);
    }
    if (activeTab === "quizzes") {
      const { data } = await supabase.from("quizzes").select("*").eq("course_id", selected.id);
      setQuizzes(data || []);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setMessage("");
    const filePath = `materials/${selected.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("unilearn").upload(filePath, file);
    if (uploadError) { setMessage("Upload failed: " + uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("unilearn").getPublicUrl(filePath);
    await supabase.from("materials").insert({
      course_id: selected.id,
      title: file.name,
      type: file.name.match(/\.(pdf)$/i) ? "PDF" : file.name.match(/\.(mp4|mov)$/i) ? "Video" : file.name.match(/\.(ppt|pptx)$/i) ? "Slides" : "Document",
      file_path: urlData.publicUrl,
      file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploaded_by: user.id
    });
    setMessage("Uploaded successfully!");
    loadData();
    setUploading(false);
  };

  const submitQuiz = async () => {
    let score = 0;
    activeQuiz.questions.forEach((q, i) => { if (answers[i] === q.answer) score++; });
    await supabase.from("quiz_attempts").upsert({ quiz_id: activeQuiz.id, student_id: user.id, score, total: activeQuiz.questions.length });
    setQuizResult({ score, total: activeQuiz.questions.length });
  };

  if (loading) return <div style={{ textAlign:"center", padding:60, color:"#888" }}>Loading...</div>;

  if (activeQuiz && !quizResult) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={() => setActiveQuiz(null)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <Icon name="chevronLeft" size={22} color="#1A1A1A" />
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{activeQuiz.title}</div>
          <div style={{ fontSize:12, color:"#888" }}>{Object.keys(answers).length}/{activeQuiz.questions.length} answered</div>
        </div>
      </div>
      {activeQuiz.questions.map((q, qi) => (
        <div key={qi} style={{ background:"#fff", borderRadius:16, padding:20, marginBottom:14, border:"1px solid #E8E8E8" }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:16, lineHeight:1.5 }}>Q{qi+1}. {q.q}</div>
          {q.options.map((opt, oi) => (
            <div key={oi} onClick={() => setAnswers({...answers, [qi]: oi})}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, marginBottom:8, border:`2px solid ${answers[qi]===oi?"#1B4332":"#E8E8E8"}`, background:answers[qi]===oi?"#1B433210":"#fff", cursor:"pointer" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${answers[qi]===oi?"#1B4332":"#ccc"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {answers[qi]===oi && <div style={{ width:10, height:10, borderRadius:"50%", background:"#1B4332" }} />}
              </div>
              <span style={{ fontSize:14, color:"#1A1A1A" }}>{opt}</span>
            </div>
          ))}
        </div>
      ))}
      <button onClick={submitQuiz} style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:12, padding:"15px 0", width:"100%", fontSize:15, fontWeight:700, cursor:"pointer" }}>Submit Quiz</button>
    </div>
  );

  if (quizResult) {
    const pct = Math.round((quizResult.score / quizResult.total) * 100);
    return (
      <div style={{ textAlign:"center", paddingTop:40 }}>
        <div style={{ fontSize:72, marginBottom:16 }}>{pct >= 70 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>
        <div style={{ fontSize:48, fontWeight:800, color:pct>=70?"#10B981":pct>=50?"#F59E0B":"#EF4444" }}>{pct}%</div>
        <div style={{ fontSize:18, color:"#888", marginTop:8 }}>{quizResult.score} out of {quizResult.total} correct</div>
        <div style={{ background:"#E8E8E8", borderRadius:20, height:8, margin:"24px 0", overflow:"hidden" }}>
          <div style={{ background:pct>=70?"#10B981":pct>=50?"#F59E0B":"#EF4444", height:"100%", width:`${pct}%`, borderRadius:20 }} />
        </div>
        <button onClick={() => { setQuizResult(null); setActiveQuiz(null); setAnswers({}); }}
          style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:12, padding:"15px 32px", fontSize:15, fontWeight:700, cursor:"pointer" }}>Done</button>
      </div>
    );
  }

  if (selected) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={() => { setSelected(null); setMessage(""); }} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <Icon name="chevronLeft" size={22} color="#1A1A1A" />
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{selected.code}</div>
          <div style={{ fontSize:12, color:"#888" }}>{selected.title}</div>
        </div>
        <div style={{ background:selected.color+"18", color:selected.color, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>{selected.units}u</div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["materials","file","Materials"],["assignments","clipboard","Tasks"],["quizzes","chart","Quizzes"]].map(([t, icon, label]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 0", borderRadius:14, border:"none", background:activeTab===t?"#1B4332":C.card, color:activeTab===t?"#fff":C.muted, fontWeight:600, fontSize:11, cursor:"pointer", border:`1px solid ${activeTab===t?"transparent":C.border}` }}>
            <Icon name={icon} size={18} color={activeTab===t?"#fff":C.muted} />
            {label}
          </button>
        ))}
      </div>

      {message && <div style={{ background:"#D1FAE5", color:"#10B981", padding:"12px 16px", borderRadius:10, marginBottom:16, fontSize:13 }}>{message}</div>}

      {activeTab === "materials" && (
        <div>
          <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"#1B4332", color:"#fff", borderRadius:14, padding:"14px 0", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:20 }}>
            <Icon name="upload" size={18} color="#fff" />
            {uploading ? "Uploading..." : "Upload Material"}
            <input type="file" style={{ display:"none" }} onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4" disabled={uploading} />
          </label>
          {materials.length === 0 && <div style={{ textAlign:"center", color:"#888", padding:"40px 0", fontSize:14 }}>No materials yet.</div>}
          {materials.map(m => (
            <div key={m.id} style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, background:m.type==="PDF"?"#EF444418":m.type==="Video"?"#3B82F618":"#F59E0B18", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name="file" size={20} color={m.type==="PDF"?"#EF4444":m.type==="Video"?"#3B82F6":"#F59E0B"} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.title}</div>
                  <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{m.type} · {m.file_size}</div>
                </div>
                <a href={m.file_path} target="_blank" rel="noreferrer"
                  style={{ background:"#1B433218", color:"#1B4332", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>View</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "assignments" && (
        <div>
          {assignments.length === 0 && <div style={{ textAlign:"center", color:"#888", padding:"40px 0", fontSize:14 }}>No assignments yet.</div>}
          {assignments.map(a => {
            const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
            return (
              <div key={a.id} style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}` }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:8 }}>{a.title}</div>
                <div style={{ fontSize:13, color:"#888", lineHeight:1.6, marginBottom:12 }}>{a.description}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ background:days<3?"#FEE2E2":"#FEF3C7", color:days<3?"#EF4444":"#F59E0B", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>
                    Due: {a.due_date} {days >= 0 ? `(${days}d)` : "(overdue)"}
                  </span>
                  <span style={{ background:"#EFF6FF", color:"#3B82F6", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>{a.max_score} marks</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "quizzes" && (
        <div>
          {quizzes.length === 0 && <div style={{ textAlign:"center", color:"#888", padding:"40px 0", fontSize:14 }}>No quizzes yet.</div>}
          {quizzes.map(q => (
            <div key={q.id} style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{q.title}</div>
                  <div style={{ fontSize:12, color:"#888", marginTop:4 }}>{q.questions?.length || 0} questions · {q.duration_minutes} mins</div>
                </div>
                <button onClick={() => { setActiveQuiz(q); setAnswers({}); setQuizResult(null); }}
                  style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Start</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:800, marginBottom:20, color:C.text, letterSpacing:-0.5 }}>Courses</div>
      {courses.map(c => (
        <div key={c.id} onClick={() => setSelected(c)}
          style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
          <div style={{ width:48, height:48, background:c.color+"18", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name="book" size={22} color={c.color} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{c.code}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:3 }}>{c.title}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            <span style={{ background:c.color+"18", color:c.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{c.units}u</span>
            <Icon name="chevronRight" size={16} color="#888" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CallScreen({ callType, onClose, C }) {
  const [status, setStatus] = useState("connecting");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const iframeRef = useRef(null);
  const [roomUrl, setRoomUrl] = useState(null);

  useEffect(() => {
    const createRoom = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/call/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callType })
        });
        const data = await res.json();
        if (data.url) { setRoomUrl(data.url); setStatus("active"); }
      } catch (err) {
        setStatus("error");
      }
    };
    createRoom();
  }, []);

  useEffect(() => {
    if (status !== "active") return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  if (roomUrl) return (
    <div style={{ position:"fixed", inset:0, background:"#000", zIndex:999, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"14px 18px", background:"rgba(0,0,0,0.8)" }}>
        <div style={{ flex:1, color:"#fff", fontWeight:600 }}>{callType === "video" ? "Video Call" : "Voice Call"} · {fmt(elapsed)}</div>
        <button onClick={onClose} style={{ background:"#EF4444", border:"none", borderRadius:10, padding:"8px 16px", color:"#fff", fontWeight:700, cursor:"pointer" }}>End</button>
      </div>
      <iframe ref={iframeRef} src={roomUrl} style={{ flex:1, border:"none" }} allow="camera; microphone; fullscreen; display-capture" />
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"#0D1B2A", zIndex:999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:32 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:12, color:"#94A3B8", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>{callType === "video" ? "Video Call" : "Voice Call"}</div>
        <div style={{ fontSize:22, color:"#fff", fontWeight:700 }}>Connecting...</div>
      </div>
      <div style={{ width:100, height:100, borderRadius:"50%", background:"linear-gradient(135deg,#1B4332,#F4A261)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon name={callType === "video" ? "video" : "phone"} size={40} color="#fff" />
      </div>
      <button onClick={onClose} style={{ width:60, height:60, borderRadius:"50%", background:"#EF4444", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon name={callType === "video" ? "videoOff" : "phoneOff"} size={24} color="#fff" />
      </button>
    </div>
  );
}

function Forum({ user, C, onCall }) {
  const [courses, setCourses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newPost, setNewPost] = useState("");
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => setCourses(data || []));
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase.from("forum_posts").select("*, profiles(name, role)").is("parent_id", null).order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const postMessage = async () => {
    if (!newPost.trim() || !selectedCourse) return;
    await supabase.from("forum_posts").insert({ course_id: selectedCourse, author_id: user.id, content: newPost });
    setNewPost("");
    loadPosts();
  };

  const postReply = async (parentId) => {
    const text = replies[parentId];
    if (!text?.trim()) return;
    await supabase.from("forum_posts").insert({ course_id: selectedCourse, author_id: user.id, content: text, parent_id: parentId });
    setReplies({ ...replies, [parentId]: "" });
    loadPosts();
  };

  const filtered = selectedCourse ? posts.filter(p => p.course_id === selectedCourse) : posts;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, flex:1, color:C.text, letterSpacing:-0.5 }}>Forum</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => onCall("video")} style={{ background:"#1B433218", border:"none", borderRadius:10, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="video" size={18} color="#1B4332" />
          </button>
          <button onClick={() => onCall("voice")} style={{ background:"#F4A26118", border:"none", borderRadius:10, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="phone" size={18} color="#F4A261" />
          </button>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
        <button onClick={() => setSelectedCourse(null)} style={{ padding:"8px 16px", borderRadius:20, border:"none", background:!selectedCourse?"#1B4332":C.card, color:!selectedCourse?"#fff":C.muted, fontWeight:600, fontSize:12, cursor:"pointer", whiteSpace:"nowrap", border:`1px solid ${C.border}` }}>All</button>
        {courses.map(c => (
          <button key={c.id} onClick={() => setSelectedCourse(selectedCourse===c.id?null:c.id)}
            style={{ padding:"8px 16px", borderRadius:20, border:"none", background:selectedCourse===c.id?"#1B4332":C.card, color:selectedCourse===c.id?"#fff":C.muted, fontWeight:600, fontSize:12, cursor:"pointer", whiteSpace:"nowrap", border:`1px solid ${C.border}` }}>{c.code}</button>
        ))}
      </div>

      {selectedCourse && (
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:16, border:`1px solid ${C.border}` }}>
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Ask a question or start a discussion..."
            style={{ width:"100%", border:"none", background:"transparent", fontSize:14, color:C.text, resize:"none", outline:"none", height:80, fontFamily:"Inter, sans-serif" }} />
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={postMessage} style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:10, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Icon name="send" size={14} color="#fff" /> Post
            </button>
          </div>
        </div>
      )}

      {!selectedCourse && <div style={{ textAlign:"center", color:"#888", padding:"20px 0", fontSize:13 }}>Select a course to view discussions.</div>}

      {filtered.map(p => (
        <div key={p.id} style={{ background:C.card, borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:p.profiles?.role==="lecturer"?"#1B433220":"#3B82F620", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="users" size={16} color={p.profiles?.role==="lecturer"?"#1B4332":"#3B82F6"} />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{p.profiles?.name}</div>
              <div style={{ fontSize:11, color:"#888" }}>{p.profiles?.role} · {new Date(p.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div style={{ fontSize:14, lineHeight:1.6, color:C.text }}>{p.content}</div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <input value={replies[p.id] || ""} onChange={e => setReplies({...replies, [p.id]: e.target.value})} placeholder="Reply..."
              style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px", fontSize:13, background:C.bg, color:C.text, outline:"none", fontFamily:"Inter, sans-serif" }} />
            <button onClick={() => postReply(p.id)} style={{ background:"#1B4332", border:"none", borderRadius:10, padding:"8px 14px", cursor:"pointer" }}>
              <Icon name="send" size={14} color="#fff" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function More({ user, dark, setDark, setTab, onLogout, C }) {
  const items = [
    { label:"Timetable", icon:"calendar", tab:"timetable", desc:"Weekly class schedule" },
    { label:"Attendance", icon:"users", tab:"attendance", desc:"Track your attendance" },
    { label:"Grades", icon:"chart", tab:"grades", desc:"Academic performance & GPA" },
  ];
  return (
    <div>
      <div style={{ fontSize:22, fontWeight:800, marginBottom:24, color:C.text, letterSpacing:-0.5 }}>More</div>
      {items.map(it => (
        <div key={it.tab} onClick={() => setTab(it.tab)}
          style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
          <div style={{ width:44, height:44, background:"#1B433218", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name={it.icon} size={20} color="#1B4332" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{it.label}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{it.desc}</div>
          </div>
          <Icon name="chevronRight" size={18} color="#888" />
        </div>
      ))}

      <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:44, height:44, background:"#1B433218", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name={dark ? "sun" : "moon"} size={20} color="#1B4332" />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{dark ? "Light Mode" : "Dark Mode"}</div>
        </div>
        <div onClick={() => setDark(!dark)} style={{ width:48, height:28, borderRadius:14, background:dark?"#1B4332":"#E8E8E8", cursor:"pointer", position:"relative", transition:"background 0.3s" }}>
          <div style={{ position:"absolute", top:4, left:dark?24:4, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.3s" }} />
        </div>
      </div>

      <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}`, marginBottom:16, marginTop:24 }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:"#1B433220", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
          <Icon name="users" size={22} color="#1B4332" />
        </div>
        <div style={{ fontWeight:700, fontSize:16, color:C.text }}>{user?.name}</div>
        <div style={{ fontSize:13, color:"#888", marginTop:4 }}>{user?.email}</div>
        <div style={{ fontSize:13, color:"#888" }}>{user?.department} · {user?.level}</div>
        {user?.matric && <div style={{ fontSize:13, color:"#888" }}>Matric: {user?.matric}</div>}
      </div>

      <button onClick={onLogout} style={{ background:"#FEE2E2", color:"#EF4444", border:"none", borderRadius:14, padding:"16px 0", width:"100%", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <Icon name="logout" size={18} color="#EF4444" /> Sign Out
      </button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [callType, setCallType] = useState(null);
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
      } else { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTab("home");
  };

  const NAV = [
    { id:"home", icon:"home", label:"Home" },
    { id:"courses", icon:"book", label:"Courses" },
    { id:"forum", icon:"send", label:"Forum" },
    { id:"more", icon:"more", label:"More" },
  ];

  const EXTRAS = ["timetable","attendance","grades"];

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#1B4332" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:64, height:64, background:"#F4A261", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <Icon name="book" size={32} color="#fff" />
        </div>
        <div style={{ color:"#fff", fontSize:18, fontWeight:700 }}>UniLearn</div>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginTop:8 }}>Loading...</div>
      </div>
    </div>
  );

  if (!user) return <Auth onLogin={setUser} />;
  if (callType) return <CallScreen callType={callType} onClose={() => setCallType(null)} C={C} />;

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:C.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto", position:"relative" }}>
      <div style={{ background:C.headerBg, color:C.headerText, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {EXTRAS.includes(tab) && (
            <button onClick={() => setTab("more")} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
              <Icon name="chevronLeft" size={22} color={C.headerText} />
            </button>
          )}
          <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.3 }}>UniLearn</div>
        </div>
        <button onClick={() => setDark(!dark)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Icon name={dark?"sun":"moon"} size={20} color={C.headerText} />
        </button>
      </div>

      <div style={{ padding:"20px 20px", paddingBottom:100 }}>
        {tab === "home" && <Dashboard user={user} C={C} setTab={setTab} />}
        {tab === "courses" && <Courses user={user} C={C} />}
        {tab === "forum" && <Forum user={user} C={C} onCall={setCallType} />}
        {tab === "more" && <More user={user} dark={dark} setDark={setDark} setTab={setTab} onLogout={handleLogout} C={C} />}
        {tab === "timetable" && <div style={{ color:C.text, textAlign:"center", paddingTop:40, fontSize:14 }}>Timetable coming soon</div>}
        {tab === "attendance" && <div style={{ color:C.text, textAlign:"center", paddingTop:40, fontSize:14 }}>Attendance coming soon</div>}
        {tab === "grades" && <div style={{ color:C.text, textAlign:"center", paddingTop:40, fontSize:14 }}>Grades coming soon</div>}
      </div>

      {!EXTRAS.includes(tab) && (
        <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.navBg, borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 20px" }}>
          {NAV.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:"6px 0" }}>
              <Icon name={t.icon} size={22} color={tab===t.id?C.primary:C.muted} strokeWidth={tab===t.id?2.2:1.6} />
              <span style={{ fontSize:10, fontWeight:tab===t.id?700:500, color:tab===t.id?C.primary:C.muted, letterSpacing:0.2 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
