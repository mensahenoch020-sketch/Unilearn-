import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import { validateFile } from "../../utils/grades.js";
import { ALLOWED_MATERIAL_TYPES, MAX_FILE_SIZE_MB } from "../../data.js";
import Ic from "../../components/Ic.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import CallScreen from "../../components/CallScreen.jsx";
import CourseDiscussion from "../../components/CourseDiscussion.jsx";

export default function LecturerApp({ user, setUser, dark, setDark, C, onLogout }) {
  const [tab, setTab] = useState("home");
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("materials");
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selAssignment, setSelAssignment] = useState(null);
  const [callType, setCallType] = useState(null);

  // Forms
  const [aForm, setAForm] = useState({ title: "", description: "", due_date: "", max_score: 20 });
  const [annForm, setAnnForm] = useState({ title: "", body: "", priority: "normal" });
  const [qForm, setQForm] = useState({ title: "", duration_minutes: 15, questions: [] });
  const [newQ, setNewQ] = useState({ q: "", options: ["", "", "", ""], answer: 0 });
  const [gradeForm, setGradeForm] = useState({});
  const [gradeSubForm, setGradeSubForm] = useState({ score: "", feedback: "" });

  const inp = {
    width: "100%",
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    background: C.inputBg,
    color: C.text,
    outline: "none",
    fontFamily: "Inter,sans-serif",
  };

  useEffect(() => {
    supabase.from("courses").select("*").then(({ data }) => { setCourses(data || []); setLoading(false); });
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => setAnnouncements(data || []));
  }, []);

  useEffect(() => { if (selected) loadData(); }, [selected, activeTab]);

  const loadData = async () => {
    setMessage(""); setError("");
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
    if (activeTab === "grades") {
      const { data: g } = await supabase.from("grades").select("*, profiles(name,matric)").eq("course_id", selected.id);
      setGrades(g || []);
      const { data: e } = await supabase.from("enrollments").select("*, profiles(*)").eq("course_id", selected.id);
      setStudents((e || []).map((x) => x.profiles).filter(Boolean));
    }
  };

  const loadSubmissions = async (assignmentId) => {
    const { data } = await supabase.from("submissions").select("*, profiles(name,matric)").eq("assignment_id", assignmentId);
    setSubmissions(data || []);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateFile(file, ALLOWED_MATERIAL_TYPES, MAX_FILE_SIZE_MB);
    if (err) { setError(err); return; }
    setUploading(true); setMessage(""); setError("");
    const filePath = `materials/${selected.id}/${Date.now()}_${file.name}`;
    const { error: ue } = await supabase.storage.from("unilearn").upload(filePath, file);
    if (ue) { setError("Upload failed: " + ue.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("unilearn").getPublicUrl(filePath);
    const type = file.name.match(/\.pdf$/i) ? "PDF" : file.name.match(/\.(mp4|mov)$/i) ? "Video" : file.name.match(/\.(jpg|jpeg|png)$/i) ? "Image" : "Document";
    await supabase.from("materials").insert({
      course_id: selected.id, title: file.name, type,
      file_path: urlData.publicUrl, file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploaded_by: user.id,
    });
    setMessage("Uploaded successfully!"); loadData(); setUploading(false);
  };

  const createAssignment = async () => {
    if (!aForm.title || !aForm.due_date) return setError("Please fill in title and due date.");
    await supabase.from("assignments").insert({ course_id: selected.id, ...aForm, max_score: +aForm.max_score });
    setMessage("Assignment created!"); setAForm({ title: "", description: "", due_date: "", max_score: 20 });
    setShowForm(false); loadData();
  };

  const addQuestion = () => {
    if (!newQ.q) return setError("Enter a question.");
    if (newQ.options.some((o) => !o.trim())) return setError("Fill in all answer options.");
    setQForm({ ...qForm, questions: [...qForm.questions, { ...newQ }] });
    setNewQ({ q: "", options: ["", "", "", ""], answer: 0 }); setError("");
  };

  const createQuiz = async () => {
    if (!qForm.title || qForm.questions.length === 0) return setError("Add a title and at least one question.");
    await supabase.from("quizzes").insert({ course_id: selected.id, ...qForm, created_by: user.id });
    setMessage("Quiz created!"); setQForm({ title: "", duration_minutes: 15, questions: [] });
    setShowForm(false); loadData();
  };

  const saveGrades = async (studentId) => {
    const g = gradeForm[studentId];
    if (!g) return;
    await supabase.from("grades").upsert({
      student_id: studentId, course_id: selected.id,
      ca1: +g.ca1 || 0, ca2: +g.ca2 || 0, midterm: +g.midterm || 0, exam: +g.exam || null,
    });
    setMessage("Grades saved for student!");
  };

  const gradeSubmission = async (subId) => {
    if (!gradeSubForm.score) return setError("Enter a score.");
    await supabase.from("submissions").update({ score: +gradeSubForm.score, feedback: gradeSubForm.feedback }).eq("id", subId);
    setMessage("Submission graded!"); setGradeSubForm({ score: "", feedback: "" });
    loadSubmissions(selAssignment.id);
  };

  const postAnnouncement = async () => {
    if (!annForm.title || !annForm.body) return setError("Please fill in all announcement fields.");
    await supabase.from("announcements").insert({ ...annForm, author_id: user.id });
    setMessage("Announcement posted!"); setAnnForm({ title: "", body: "", priority: "normal" });
    setShowForm(false);
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => setAnnouncements(data || []));
  };

  if (callType) return <CallScreen callType={callType} onClose={() => setCallType(null)} />;

  const NAV = [
    { id: "home", icon: "home", label: "Home" },
    { id: "courses", icon: "book", label: "Courses" },
    { id: "announce", icon: "bell", label: "Notices" },
    { id: "more", icon: "more", label: "More" },
  ];

  // ── SUBMISSION REVIEW ─────────────────────────────────
  if (selAssignment) return (
    <div style={{ fontFamily: "Inter,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.headerBg, color: C.headerText, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setSelAssignment(null); setSubmissions([]); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n="chevronL" s={22} c={C.headerText} />
        </button>
        <div style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>Submissions — {selAssignment.title}</div>
      </div>
      <div style={{ padding: 20 }}>
        {message && <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>✓ {message}</div>}
        <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, color: C.text }}>{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Max score: {selAssignment.max_score}</div>
        </div>
        {submissions.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No submissions yet.</div>}
        {submissions.map((s) => (
          <div key={s.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.profiles?.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Matric: {s.profiles?.matric}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Submitted: {new Date(s.submitted_at).toLocaleDateString()}</div>
            {s.file_path && (
              <a href={s.file_path} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.bg, color: C.primary, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none", marginTop: 8 }}>
                <Ic n="file" s={14} c={C.primary} /> View File
              </a>
            )}
            {s.score !== null ? (
              <div style={{ marginTop: 10, background: "#D1FAE5", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontWeight: 700, color: "#10B981" }}>Graded: {s.score}/{selAssignment.max_score}</div>
                {s.feedback && <div style={{ fontSize: 12, color: "#065F46", marginTop: 4 }}>Feedback: {s.feedback}</div>}
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Score (/{selAssignment.max_score})</label>
                    <input type="number" min="0" max={selAssignment.max_score} value={gradeSubForm.score} onChange={(e) => setGradeSubForm({ ...gradeSubForm, score: e.target.value })} style={{ ...inp, padding: "8px 12px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Feedback (optional)</label>
                    <input value={gradeSubForm.feedback} onChange={(e) => setGradeSubForm({ ...gradeSubForm, feedback: e.target.value })} style={{ ...inp, padding: "8px 12px" }} placeholder="Comment..." />
                  </div>
                </div>
                <button onClick={() => gradeSubmission(s.id)} style={{ background: C.success, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", width: "100%", fontWeight: 700, cursor: "pointer" }}>
                  Save Grade
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── COURSE DETAIL ─────────────────────────────────────
  if (selected) return (
    <div style={{ fontFamily: "Inter,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.headerBg, color: C.headerText, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => { setSelected(null); setMessage(""); setError(""); setShowForm(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n="chevronL" s={22} c={C.headerText} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{selected.code}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{selected.title}</div>
        </div>
        <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n={dark ? "sun" : "moon"} s={20} c={C.headerText} />
        </button>
      </div>
      <div style={{ padding: "20px", paddingBottom: 40 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {[["materials", "file", "Materials"], ["assignments", "clip", "Tasks"], ["quizzes", "chart", "Quizzes"], ["grades", "user", "Grades"], ["discussion", "send", "Forum"]].map(([t, icon, label]) => (
            <button key={t} onClick={() => { setActiveTab(t); setShowForm(false); setMessage(""); setError(""); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 12, border: "none", background: activeTab === t ? C.primary : C.card, cursor: "pointer", flexShrink: 0 }}>
              <Ic n={icon} s={16} c={activeTab === t ? "#fff" : C.muted} />
              <span style={{ fontSize: 11, fontWeight: 700, color: activeTab === t ? "#fff" : C.muted }}>{label}</span>
            </button>
          ))}
        </div>
        {message && <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>✓ {message}</div>}
        {error && <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        {/* Materials */}
        {activeTab === "materials" && (
          <div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.info, color: "#fff", borderRadius: 12, padding: "12px 0", cursor: "pointer", marginBottom: 16, fontWeight: 700 }}>
              <Ic n="upload" s={18} c="#fff" />{uploading ? "Uploading..." : "Upload Material"}
              <input type="file" style={{ display: "none" }} onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.jpg,.png" />
            </label>
            {materials.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No materials uploaded yet.</div>}
            {materials.map((m) => (
              <div key={m.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: m.type === "PDF" ? "#EF444418" : "#3B82F618", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n="file" s={20} c={m.type === "PDF" ? "#EF4444" : "#3B82F6"} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.type} · {m.file_size}</div>
                </div>
                <a href={m.file_path} target="_blank" rel="noreferrer" style={{ background: C.primary, color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Open</a>
              </div>
            ))}
          </div>
        )}

        {/* Assignments */}
        {activeTab === "assignments" && (
          <div>
            <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, background: C.success, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>
              <Ic n="plus" s={18} c="#fff" />{showForm ? "Cancel" : "Create Assignment"}
            </button>
            {showForm && (
              <div style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Title *</label>
                  <input style={inp} value={aForm.title} onChange={(e) => setAForm({ ...aForm, title: e.target.value })} placeholder="Assignment title" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Description</label>
                  <textarea style={{ ...inp, minHeight: 80, resize: "none" }} value={aForm.description} onChange={(e) => setAForm({ ...aForm, description: e.target.value })} placeholder="What should students submit?" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Due Date *</label>
                    <input style={inp} type="date" value={aForm.due_date} onChange={(e) => setAForm({ ...aForm, due_date: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Max Score</label>
                    <input style={inp} type="number" value={aForm.max_score} onChange={(e) => setAForm({ ...aForm, max_score: e.target.value })} />
                  </div>
                </div>
                <button onClick={createAssignment} style={{ background: C.success, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", width: "100%", fontWeight: 700, cursor: "pointer" }}>
                  Create Assignment
                </button>
              </div>
            )}
            {assignments.map((a) => {
              const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
              return (
                <div key={a.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <Badge text={`Due: ${a.due_date}`} bg={C.bg} color={C.muted} />
                    <Badge text={days < 0 ? "Overdue" : `${days}d left`} bg={days < 0 ? "#FEE2E2" : "#D1FAE5"} color={days < 0 ? "#EF4444" : "#065F46"} />
                    <Badge text={`${a.max_score} marks`} bg="#EFF6FF" color="#3B82F6" />
                  </div>
                  <button onClick={async () => { setSelAssignment(a); await loadSubmissions(a.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: C.bg, color: C.primary, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    <Ic n="users" s={14} c={C.primary} /> View Submissions
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Quizzes */}
        {activeTab === "quizzes" && (
          <div>
            <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>
              <Ic n="plus" s={18} c="#fff" />{showForm ? "Cancel" : "Create Quiz"}
            </button>
            {showForm && (
              <div style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Quiz Title *</label>
                  <input style={inp} value={qForm.title} onChange={(e) => setQForm({ ...qForm, title: e.target.value })} placeholder="e.g. Chapter 3 Quiz" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Duration (minutes)</label>
                  <input style={inp} type="number" value={qForm.duration_minutes} onChange={(e) => setQForm({ ...qForm, duration_minutes: +e.target.value })} />
                </div>
                {/* Existing questions */}
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12 }}>Questions ({qForm.questions.length})</div>
                {qForm.questions.map((q, i) => (
                  <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Q{i + 1}. {q.q}</div>
                    {q.options.map((o, oi) => (
                      <div key={oi} style={{ fontSize: 12, color: oi === q.answer ? C.success : C.muted, marginTop: 4 }}>
                        {oi === q.answer ? "✓ " : "  "}{o}
                      </div>
                    ))}
                  </div>
                ))}
                {/* Add question form */}
                <div style={{ background: C.bg, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Add New Question</div>
                  <input style={{ ...inp, marginBottom: 8 }} value={newQ.q} onChange={(e) => setNewQ({ ...newQ, q: e.target.value })} placeholder="Question text..." />
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Options (click radio = correct answer)</div>
                  {newQ.options.map((o, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                      <input type="radio" checked={newQ.answer === i} onChange={() => setNewQ({ ...newQ, answer: i })} style={{ accentColor: C.primary }} />
                      <input
                        style={{ ...inp, marginBottom: 0, flex: 1 }}
                        value={o}
                        onChange={(e) => {
                          const ops = [...newQ.options]; ops[i] = e.target.value;
                          setNewQ({ ...newQ, options: ops });
                        }}
                        placeholder={`Option ${i + 1}`}
                      />
                    </div>
                  ))}
                  <button onClick={addQuestion} style={{ background: C.info, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", width: "100%", fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
                    + Add Question
                  </button>
                </div>
                <button onClick={createQuiz} style={{ background: C.success, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", width: "100%", fontWeight: 700, cursor: "pointer" }}>
                  Publish Quiz
                </button>
              </div>
            )}
            {quizzes.map((q) => (
              <div key={q.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{q.title}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{q.questions?.length || 0} questions · {q.duration_minutes} min</div>
              </div>
            ))}
          </div>
        )}

        {/* Grades */}
        {activeTab === "grades" && (
          <div>
            {students.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No students enrolled yet.</div>}
            {students.filter(Boolean).map((s) => {
              const existing = grades.find((g) => g.student_id === s.id);
              const gf = gradeForm[s.id] || { ca1: existing?.ca1 ?? "", ca2: existing?.ca2 ?? "", midterm: existing?.midterm ?? "", exam: existing?.exam ?? "" };
              return (
                <div key={s.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Matric: {s.matric}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[["CA1", 20, "ca1"], ["CA2", 20, "ca2"], ["Mid", 30, "midterm"], ["Exam", 60, "exam"]].map(([label, max, key]) => (
                      <div key={key}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}/{max}</div>
                        <input
                          type="number" min="0" max={max}
                          value={gf[key]}
                          onChange={(e) => setGradeForm({ ...gradeForm, [s.id]: { ...gf, [key]: e.target.value } })}
                          style={{ ...inp, padding: "8px 10px", textAlign: "center" }}
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => saveGrades(s.id)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", width: "100%", fontWeight: 700, cursor: "pointer" }}>
                    Save Grades
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Discussion */}
        {activeTab === "discussion" && (
          <CourseDiscussion course={selected} user={user} C={C} onCall={setCallType} />
        )}
      </div>
    </div>
  );

  // ── MAIN LECTURER LAYOUT ───────────────────────────────
  return (
    <div style={{ fontFamily: "Inter,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ background: C.headerBg, color: C.headerText, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>UniLearn</div>
        <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n={dark ? "sun" : "moon"} s={20} c={C.headerText} />
        </button>
      </div>

      <div style={{ padding: "20px", paddingBottom: 100 }}>
        {/* Home */}
        {tab === "home" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`, borderRadius: 20, padding: "24px 20px", marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
              <div style={{ fontSize: 12, opacity: 0.65, letterSpacing: 0.5 }}>FACULTY OF {user?.faculty?.toUpperCase()}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, letterSpacing: -0.5 }}>{user?.name}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Lecturer · {user?.department}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>{courses.length} Courses</div>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: C.muted, letterSpacing: 0.5 }}>MY COURSES</div>
            {courses.map((c) => (
              <div key={c.id} onClick={() => { setSelected(c); setActiveTab("materials"); setTab("home"); }}
                style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 48, height: 48, background: (c.color || "#1B4332") + "18", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n="book" s={22} c={c.color || "#1B4332"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{c.code}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{c.title}</div>
                </div>
                <Ic n="chevronR" s={16} c={C.muted} />
              </div>
            ))}
          </div>
        )}

        {/* Announcements */}
        {tab === "announce" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: C.text }}>Announcements</div>
            {message && <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>✓ {message}</div>}
            {error && <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>{error}</div>}
            <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>
              <Ic n="plus" s={18} c="#fff" />{showForm ? "Cancel" : "Post Announcement"}
            </button>
            {showForm && (
              <div style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Title *</label>
                  <input style={inp} value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} placeholder="Announcement title" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Message *</label>
                  <textarea style={{ ...inp, minHeight: 100, resize: "none" }} value={annForm.body} onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })} placeholder="Write your announcement..." />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Priority</label>
                  <select style={inp} value={annForm.priority} onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="high">High (Urgent)</option>
                  </select>
                </div>
                <button onClick={postAnnouncement} style={{ background: C.success, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", width: "100%", fontWeight: 700, cursor: "pointer" }}>
                  Post Announcement
                </button>
              </div>
            )}
            {announcements.map((a) => (
              <div key={a.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, flex: 1 }}>{a.title}</div>
                  {a.priority === "high" && <Badge text="Urgent" bg="#FEE2E2" color="#EF4444" />}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{a.body}</div>
              </div>
            ))}
          </div>
        )}

        {/* More */}
        {tab === "more" && (
          <div>
            <div style={{ background: C.card, borderRadius: 20, padding: 20, marginBottom: 20, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#1B4332,#2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Ic n="user" s={26} c="#fff" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{user?.email}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Lecturer · {user?.department}</div>
              </div>
            </div>
            <div style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, background: C.primary + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic n={dark ? "sun" : "moon"} s={20} c={C.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{dark ? "Light Mode" : "Dark Mode"}</div>
              </div>
              <div onClick={() => setDark(!dark)} style={{ width: 50, height: 28, borderRadius: 14, background: dark ? C.primary : C.border, position: "relative", cursor: "pointer" }}>
                <div style={{ position: "absolute", top: 4, left: dark ? 26 : 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.3s" }} />
              </div>
            </div>
            <button onClick={onLogout} style={{ background: "#FEE2E2", color: "#EF4444", border: "none", borderRadius: 14, padding: "16px 0", width: "100%", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "Inter,sans-serif", marginTop: 10 }}>
              <Ic n="logout" s={18} c="#EF4444" /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.navBg, backdropFilter: "blur(10px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "8px 0", zIndex: 100 }}>
        {NAV.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? C.primary + "18" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic n={t.icon} s={22} c={active ? C.primary : C.muted} w={active ? 2.2 : 1.6} />
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.primary : C.muted }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
