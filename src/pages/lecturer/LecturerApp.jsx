import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase.js";
import QRCode from "qrcode";
import { validateFile } from "../../utils/grades.js";
import { playNotif } from "../../utils/sound.js";
import { ALLOWED_MATERIAL_TYPES, MAX_FILE_SIZE_MB } from "../../data.js";
import Ic from "../../components/Ic.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import CallScreen from "../../components/CallScreen.jsx";
import CourseDiscussion from "../../components/CourseDiscussion.jsx";
import DirectMessage from "../../components/DirectMessage.jsx";
import LecturerCourseEnrollment from "./LecturerCourseEnrollment.jsx";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function Card({ children, style = {}, C, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}


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
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selAssignment, setSelAssignment] = useState(null);
  const [callType, setCallType] = useState(null);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [dmStudents, setDmStudents] = useState([]);
  const [dmStudent, setDmStudent] = useState(null);
  const [aForm, setAForm] = useState({ title: "", description: "", due_date: "", max_score: 20 });
  const [annForm, setAnnForm] = useState({ title: "", body: "", priority: "normal" });
  const [qForm, setQForm] = useState({ title: "", duration_minutes: 15, questions: [] });
  const [newQ, setNewQ] = useState({ q: "", options: ["", "", "", ""], answer: 0 });
  const [gradeForm, setGradeForm] = useState({});
  const [gradeSubForm, setGradeSubForm] = useState({ score: "", feedback: "" });
  const [ttForm, setTtForm] = useState({ day: "Monday", start_time: "08:00", end_time: "10:00", venue: "" });
  const [msgToast, setMsgToast] = useState(null);
  const [globalUnread, setGlobalUnread] = useState(0);
  const [globalConversations, setGlobalConversations] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [takingAttendance, setTakingAttendance] = useState(false);
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrTimeLeft, setQrTimeLeft] = useState(0);
  const toastTimerRef = useRef(null);
  const qrIntervalRef = useRef(null);

  const inp = {
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 12,
    padding: "12px 16px", fontSize: 14, background: C.inputBg, color: C.text,
    outline: "none", fontFamily: "Inter,sans-serif",
  };

  // Fix: show faculty if available, else department, else "LECTURER"
  const facultyDisplay = user?.faculty
    ? user.faculty.toUpperCase()
    : user?.department?.toUpperCase() || "LECTURER";

  useEffect(() => { loadCourses(); loadAnnouncements(); loadGlobalUnread(); loadGlobalConversations(); }, []);
  useEffect(() => { if (selected) loadData(); }, [selected, activeTab]);

  // Global real-time listener — fires for ANY new DM sent to this lecturer
  useEffect(() => {
    const ch = supabase
      .channel(`lec_global_dm_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        playNotif();
        setGlobalUnread(n => n + 1);
        // Fetch sender name for toast
        const { data: sender } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", payload.new.sender_id)
          .single();
        const preview = (payload.new.body || "").slice(0, 60);
        clearTimeout(toastTimerRef.current);
        setMsgToast({ name: sender?.name || "Student", body: preview, courseId: payload.new.course_id });
        toastTimerRef.current = setTimeout(() => setMsgToast(null), 5000);
        loadGlobalConversations();
        if (selected?.id === payload.new.course_id && activeTab === "messages") {
          loadDmStudents();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); clearTimeout(toastTimerRef.current); };
  }, [user.id, selected?.id, activeTab]);

  // Per-course real-time listener when messages tab is open
  useEffect(() => {
    if (!selected || activeTab !== "messages") return;
    const ch = supabase
      .channel(`lec_dm_${selected.id}_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `course_id=eq.${selected.id}`,
      }, (payload) => {
        if (payload.new?.receiver_id === user.id) {
          loadDmStudents();
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [selected?.id, activeTab]);

  const loadCourses = async () => {
    const { data: lc } = await supabase
      .from("lecturer_courses")
      .select("*, courses(*)")
      .eq("lecturer_id", user.id);
    setCourses((lc || []).map((x) => x.courses).filter(Boolean));
    setLoading(false);
  };

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false });
    setAnnouncements(data || []);
  };

  const loadGlobalUnread = async () => {
    const { count } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .is("read_at", null);
    setGlobalUnread(count || 0);
  };

  const loadGlobalConversations = async () => {
    const { data } = await supabase
      .from("direct_messages")
      .select("sender_id, course_id, body, created_at, read_at")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    if (!data || data.length === 0) { setGlobalConversations([]); return; }
    const seen = new Set();
    const unique = [];
    for (const msg of data) {
      const key = `${msg.course_id}_${msg.sender_id}`;
      if (!seen.has(key)) { seen.add(key); unique.push(msg); }
    }
    const senderIds = [...new Set(unique.map(m => m.sender_id))];
    const courseIds = [...new Set(unique.map(m => m.course_id))];
    const [{ data: profs }, { data: coursesData }] = await Promise.all([
      supabase.from("profiles").select("id, name, matric").in("id", senderIds),
      supabase.from("courses").select("id, code, title").in("id", courseIds),
    ]);
    const pm = {}; (profs || []).forEach(p => pm[p.id] = p);
    const cm = {}; (coursesData || []).forEach(c => cm[c.id] = c);
    setGlobalConversations(unique.map(m => ({ ...m, sender: pm[m.sender_id], course: cm[m.course_id] })));
  };

  const generateQR = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data: session } = await supabase
      .from("attendance_sessions")
      .insert({ course_id: selected.id, lecturer_id: user.id, date: today })
      .select().single();
    if (!session) { setError("Failed to create attendance session."); return; }
    const url = `${window.location.origin}/attend/${session.id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: "#1B4332", light: "#ffffff" } });
    setQrDataUrl(dataUrl);
    setShowQR(true);
    setQrTimeLeft(1800);
    clearInterval(qrIntervalRef.current);
    qrIntervalRef.current = setInterval(() => {
      setQrTimeLeft(t => {
        if (t <= 1) { clearInterval(qrIntervalRef.current); setShowQR(false); setQrDataUrl(null); loadAttendance(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const loadAttendance = async () => {
    if (!selected) return;
    const { data } = await supabase
      .from("attendance_sessions")
      .select("*, attendance_records(*)")
      .eq("course_id", selected.id)
      .order("date", { ascending: false });
    setAttendanceSessions(data || []);
  };

  const startAttendance = () => {
    const marks = {};
    students.forEach(s => { marks[s.id] = true; });
    setAttendanceMarks(marks);
    setTakingAttendance(true);
  };

  const saveAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data: session } = await supabase
      .from("attendance_sessions")
      .insert({ course_id: selected.id, lecturer_id: user.id, date: today })
      .select()
      .single();
    if (!session) return;
    const records = Object.entries(attendanceMarks).map(([student_id, present]) => ({
      session_id: session.id,
      student_id,
      course_id: selected.id,
      present,
    }));
    await supabase.from("attendance_records").insert(records);
    setTakingAttendance(false);
    loadAttendance();
    setMessage("Attendance saved!");
  };

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
    if (activeTab === "timetable") {
      const { data } = await supabase.from("timetable").select("*").eq("course_id", selected.id).order("day");
      setTimetableSlots(data || []);
    }
    if (activeTab === "messages") {
      await loadDmStudents();
    }
    if (activeTab === "attendance") {
      await loadAttendance();
      if (students.length === 0) {
        const { data: e } = await supabase.from("enrollments").select("*, profiles(*)").eq("course_id", selected.id);
        setStudents((e || []).map((x) => x.profiles).filter(Boolean));
      }
    }
  };

  const loadSubmissions = async (assignmentId) => {
    const { data } = await supabase.from("submissions").select("*, profiles(name,matric)").eq("assignment_id", assignmentId);
    setSubmissions(data || []);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const err = validateFile(file, ALLOWED_MATERIAL_TYPES, MAX_FILE_SIZE_MB);
    if (err) { setError(err); return; }
    setUploading(true); setMessage(""); setError("");
    const filePath = `materials/${selected.id}/${Date.now()}_${file.name}`;
    const { error: ue } = await supabase.storage.from("unilearn").upload(filePath, file);
    if (ue) { setError("Upload failed: " + ue.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("unilearn").getPublicUrl(filePath);
    if (!urlData?.publicUrl) { setError("Failed to get file URL. Please try again."); setUploading(false); return; }
    const type = file.name.match(/\.pdf$/i) ? "PDF" : file.name.match(/\.(mp4|mov)$/i) ? "Video" : "Document";
    await supabase.from("materials").insert({ course_id: selected.id, title: file.name, type, file_path: urlData.publicUrl, file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, uploaded_by: user.id });
    setMessage("Uploaded!"); loadData(); setUploading(false);
  };

  const createAssignment = async () => {
    if (!aForm.title || !aForm.due_date) return setError("Fill in title and due date.");
    await supabase.from("assignments").insert({ course_id: selected.id, ...aForm, max_score: +aForm.max_score });
    setMessage("Assignment created!"); setAForm({ title: "", description: "", due_date: "", max_score: 20 }); setShowForm(false); loadData();
  };

  const addQuestion = () => {
    if (!newQ.q) return setError("Enter a question.");
    setQForm({ ...qForm, questions: [...qForm.questions, { ...newQ }] });
    setNewQ({ q: "", options: ["", "", "", ""], answer: 0 }); setError("");
  };

  const createQuiz = async () => {
    if (!qForm.title || qForm.questions.length === 0) return setError("Add title and at least one question.");
    await supabase.from("quizzes").insert({ course_id: selected.id, ...qForm, created_by: user.id });
    setMessage("Quiz created!"); setQForm({ title: "", duration_minutes: 15, questions: [] }); setShowForm(false); loadData();
  };

  const saveGrades = async (studentId) => {
    const g = gradeForm[studentId]; if (!g) return;
    await supabase.from("grades").upsert({ student_id: studentId, course_id: selected.id, ca1: +g.ca1 || 0, ca2: +g.ca2 || 0, midterm: +g.midterm || 0, exam: g.exam ? +g.exam : null });
    setMessage("Grades saved!");
  };

  const gradeSubmission = async (subId) => {
    if (!gradeSubForm.score) return setError("Enter a score.");
    await supabase.from("submissions").update({ score: +gradeSubForm.score, feedback: gradeSubForm.feedback }).eq("id", subId);
    setMessage("Graded!"); setGradeSubForm({ score: "", feedback: "" }); loadSubmissions(selAssignment.id);
  };

  const postAnnouncement = async () => {
    if (!annForm.title || !annForm.body) return setError("Fill in all fields.");
    await supabase.from("announcements").insert({ ...annForm, author_id: user.id });
    setMessage("Posted!"); setAnnForm({ title: "", body: "", priority: "normal" }); setShowForm(false); loadAnnouncements();
  };

  const addTimetableSlot = async () => {
    if (!ttForm.venue) return setError("Enter a venue.");
    await supabase.from("timetable").insert({ course_id: selected.id, ...ttForm });
    setMessage("Slot added!"); setTtForm({ day: "Monday", start_time: "08:00", end_time: "10:00", venue: "" }); setShowForm(false); loadData();
  };

  const deleteTimetableSlot = async (id) => {
    await supabase.from("timetable").delete().eq("id", id); loadData();
  };

  const removeCourse = async (courseId) => {
    await supabase.from("lecturer_courses").delete().eq("lecturer_id", user.id).eq("course_id", courseId);
    loadCourses();
  };

  const saveAllGrades = async () => {
    const rows = students.filter(Boolean).map(s => {
      const g = gradeForm[s.id];
      if (!g) return null;
      return { student_id: s.id, course_id: selected.id, ca1: +g.ca1 || 0, ca2: +g.ca2 || 0, midterm: +g.midterm || 0, exam: g.exam ? +g.exam : null };
    }).filter(Boolean);
    if (rows.length === 0) return setMessage("Enter grades first.");
    await supabase.from("grades").upsert(rows);
    setMessage("All grades saved!");
  };

  const deleteAnnouncement = async (id) => {
    await supabase.from("announcements").delete().eq("id", id);
    loadAnnouncements();
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Avatar must be under 5MB."); return; }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${ext}`;
    const { error: ue } = await supabase.storage.from("unilearn").upload(filePath, file, { upsert: true });
    if (ue) { setError(ue.message || "Avatar upload failed."); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("unilearn").getPublicUrl(filePath);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setUser({ ...user, avatar_url: urlData.publicUrl });
    setUploadingAvatar(false);
    setMessage("Profile picture updated!");
  };

  const loadDmStudents = async () => {
    const { data } = await supabase
      .from("direct_messages")
      .select("sender_id")
      .eq("course_id", selected.id)
      .eq("receiver_id", user.id);
    const uniqueIds = [...new Set((data || []).map(m => m.sender_id))];
    if (uniqueIds.length === 0) { setDmStudents([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id, name, matric").in("id", uniqueIds);
    setDmStudents(profs || []);
  };

  if (callType) return <CallScreen callType={callType} onClose={() => setCallType(null)} />;

  if (showManageCourses) return (
    <LecturerCourseEnrollment
      user={user}
      onDone={() => { setShowManageCourses(false); loadCourses(); }}
      initialSelected={courses.map(c => c.id)}
    />
  );

  const ToastEl = msgToast ? (
    <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:440, background:"#1B4332", color:"#fff", borderRadius:16, padding:"14px 16px", zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.35)", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:40, height:40, background:"rgba(255,255,255,0.15)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Ic n="msg" s={20} c="#fff" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13 }}>Message from {msgToast.name}</div>
        <div style={{ fontSize:12, opacity:0.8, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{msgToast.body || "Sent you a message"}</div>
      </div>
      <button onClick={() => setMsgToast(null)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0 }}>
        <Ic n="x" s={20} c="#fff" />
      </button>
    </div>
  ) : null;

  const timeAgo = (ts) => {
    const d = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (d < 1) return "now"; if (d < 60) return `${d}m`; if (d < 1440) return `${Math.floor(d/60)}h`; return `${Math.floor(d/1440)}d`;
  };

  const NAV = [
    { id: "home", icon: "home", label: "Home" },
    { id: "courses", icon: "book", label: "Courses" },
    { id: "announce", icon: "bell", label: "Notices" },
    { id: "messages", icon: "msg", label: "Messages" },
    { id: "more", icon: "more", label: "More" },
  ];

  // ── SUBMISSION REVIEW ──────────────────────────────────
  if (selAssignment) return (
    <div style={{ fontFamily: "Inter,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.headerBg, color: C.headerText, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => { setSelAssignment(null); setSubmissions([]); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Ic n="chevronL" s={22} c={C.headerText} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Submissions — {selAssignment.title}</div>
      </div>
      <div style={{ padding: 20 }}>
        {message && <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>✓ {message}</div>}
        {error && <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <Card C={C} style={{ padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: C.text }}>{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Max: {selAssignment.max_score} marks</div>
        </Card>
        {submissions.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No submissions yet.</div>}
        {submissions.map((s) => (
          <Card C={C} key={s.id} style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.profiles?.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Matric: {s.profiles?.matric}</div>
            {s.file_path && <a href={s.file_path} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.bg, color: C.primary, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none", marginTop: 8 }}><Ic n="file" s={14} c={C.primary} />View File</a>}
            {s.score !== null ? (
              <div style={{ marginTop: 10, background: "#D1FAE5", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontWeight: 700, color: "#10B981" }}>Graded: {s.score}/{selAssignment.max_score}</div>
                {s.feedback && <div style={{ fontSize: 12, color: "#065F46", marginTop: 4 }}>{s.feedback}</div>}
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Score (/{selAssignment.max_score})</label><input type="number" min="0" max={selAssignment.max_score} value={gradeSubForm.score} onChange={(e) => setGradeSubForm({ ...gradeSubForm, score: e.target.value })} style={{ ...inp, padding: "8px 12px" }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Feedback</label><input value={gradeSubForm.feedback} onChange={(e) => setGradeSubForm({ ...gradeSubForm, feedback: e.target.value })} style={{ ...inp, padding: "8px 12px" }} placeholder="Comment..." /></div>
                </div>
                <button onClick={() => gradeSubmission(s.id)} style={{ background: C.success, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", width: "100%", fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Save Grade</button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {ToastEl}
    </div>
  );

  // ── COURSE DETAIL ──────────────────────────────────────
  if (selected) return (
    <div style={{ fontFamily: "Inter,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.headerBg, color: C.headerText, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => { setSelected(null); setMessage(""); setError(""); setShowForm(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Ic n="chevronL" s={22} c={C.headerText} /></button>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 16 }}>{selected.code}</div><div style={{ fontSize: 12, opacity: 0.7 }}>{selected.title}</div></div>
        <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer" }}><Ic n={dark ? "sun" : "moon"} s={20} c={C.headerText} /></button>
      </div>
      <div style={{ padding: "20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {[["materials","file","Materials"],["assignments","clip","Tasks"],["quizzes","chart","Quizzes"],["grades","user","Grades"],["timetable","calendar","Timetable"],["attendance","users","Attend"],["discussion","send","Forum"],["messages","msg","Messages"]].map(([t, icon, label]) => (
            <button key={t} onClick={() => { setActiveTab(t); setShowForm(false); setMessage(""); setError(""); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 12, border: "none", background: activeTab === t ? C.primary : C.card, cursor: "pointer", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <Ic n={icon} s={16} c={activeTab === t ? "#fff" : C.muted} />
              <span style={{ fontSize: 11, fontWeight: 700, color: activeTab === t ? "#fff" : C.muted }}>{label}</span>
            </button>
          ))}
        </div>
        {message && <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>✓ {message}</div>}
        {error && <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        {activeTab === "materials" && (
          <div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.info, color: "#fff", borderRadius: 12, padding: "12px 0", cursor: "pointer", marginBottom: 16, fontWeight: 700 }}>
              <Ic n="upload" s={18} c="#fff" />{uploading ? "Uploading..." : "Upload Material"}
              <input type="file" style={{ display: "none" }} onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.jpg,.png" />
            </label>
            {materials.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No materials yet.</div>}
            {materials.map((m) => (
              <Card C={C} key={m.id} style={{ padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: m.type === "PDF" ? "#EF444415" : "#3B82F615", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic n="file" s={20} c={m.type === "PDF" ? "#EF4444" : "#3B82F6"} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.type} · {m.file_size}</div>
                </div>
                <a href={m.file_path} target="_blank" rel="noreferrer" style={{ background: C.primary, color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Open</a>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, background: C.success, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer", marginBottom: 16, fontFamily: "Inter,sans-serif" }}>
              <Ic n="plus" s={18} c="#fff" />{showForm ? "Cancel" : "Create Assignment"}
            </button>
            {showForm && <Card C={C} style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Title *</label><input style={inp} value={aForm.title} onChange={(e) => setAForm({ ...aForm, title: e.target.value })} placeholder="Assignment title" /></div>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Description</label><textarea style={{ ...inp, minHeight: 80, resize: "none" }} value={aForm.description} onChange={(e) => setAForm({ ...aForm, description: e.target.value })} placeholder="Instructions..." /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Due Date *</label><input style={inp} type="date" value={aForm.due_date} onChange={(e) => setAForm({ ...aForm, due_date: e.target.value })} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Max Score</label><input style={inp} type="number" value={aForm.max_score} onChange={(e) => setAForm({ ...aForm, max_score: e.target.value })} /></div>
              </div>
              <button onClick={createAssignment} style={{ background: C.success, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", width: "100%", fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Create</button>
            </Card>}
            {assignments.map((a) => {
              const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
              return <Card C={C} key={a.id} style={{ padding: 16, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>{a.title}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <Badge text={`Due: ${a.due_date}`} bg={C.bg} color={C.muted} />
                  <Badge text={days < 0 ? "Overdue" : `${days}d left`} bg={days < 0 ? "#FEE2E2" : "#D1FAE5"} color={days < 0 ? "#EF4444" : "#065F46"} />
                  <Badge text={`${a.max_score} marks`} bg="#EFF6FF" color="#3B82F6" />
                </div>
                <button onClick={async () => { setSelAssignment(a); await loadSubmissions(a.id); }} style={{ display: "flex", alignItems: "center", gap: 6, background: C.bg, color: C.primary, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "Inter,sans-serif" }}>
                  <Ic n="users" s={14} c={C.primary} />View Submissions
                </button>
              </Card>;
            })}
          </div>
        )}

        {activeTab === "quizzes" && (
          <div>
            <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer", marginBottom: 16, fontFamily: "Inter,sans-serif" }}>
              <Ic n="plus" s={18} c="#fff" />{showForm ? "Cancel" : "Create Quiz"}
            </button>
            {showForm && <Card C={C} style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Title *</label><input style={inp} value={qForm.title} onChange={(e) => setQForm({ ...qForm, title: e.target.value })} placeholder="Quiz title" /></div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Duration (min)</label><input style={inp} type="number" value={qForm.duration_minutes} onChange={(e) => setQForm({ ...qForm, duration_minutes: +e.target.value })} /></div>
              {qForm.questions.map((q, i) => <div key={i} style={{ background: C.bg, borderRadius: 10, padding: 10, marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Q{i+1}. {q.q}</div>{q.options.map((o,oi)=><div key={oi} style={{ fontSize:12, color: oi===q.answer ? C.success : C.muted, marginTop:3 }}>{oi===q.answer?"✓ ":"  "}{o}</div>)}</div>)}
              <div style={{ background: C.bg, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Add Question</div>
                <input style={{ ...inp, marginBottom: 8 }} value={newQ.q} onChange={(e) => setNewQ({ ...newQ, q: e.target.value })} placeholder="Question..." />
                {newQ.options.map((o,i)=><div key={i} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"center" }}><input type="radio" checked={newQ.answer===i} onChange={()=>setNewQ({...newQ,answer:i})} style={{accentColor:C.primary}}/><input style={{...inp,marginBottom:0,flex:1}} value={o} onChange={(e)=>{const ops=[...newQ.options];ops[i]=e.target.value;setNewQ({...newQ,options:ops})}} placeholder={`Option ${i+1}`}/></div>)}
                <button onClick={addQuestion} style={{ background:C.info, color:"#fff", border:"none", borderRadius:10, padding:"10px 0", width:"100%", fontWeight:700, cursor:"pointer", marginTop:8, fontFamily:"Inter,sans-serif" }}>+ Add Question</button>
              </div>
              <button onClick={createQuiz} style={{ background:C.success, color:"#fff", border:"none", borderRadius:12, padding:"12px 0", width:"100%", fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>Publish Quiz</button>
            </Card>}
            {quizzes.length===0&&!showForm&&<div style={{textAlign:"center",color:C.muted,padding:"40px 0"}}>No quizzes yet.</div>}
            {quizzes.map((q)=><Card C={C} key={q.id} style={{padding:16,marginBottom:10}}><div style={{fontWeight:700,fontSize:14,color:C.text}}>{q.title}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{q.questions?.length||0} questions · {q.duration_minutes} min</div></Card>)}
          </div>
        )}

        {activeTab === "grades" && (
          <div>
            {students.length > 0 && (
              <button onClick={saveAllGrades} style={{ display: "flex", alignItems: "center", gap: 8, background: C.success, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer", marginBottom: 16, fontFamily: "Inter,sans-serif" }}>
                <Ic n="check" s={16} c="#fff" w={2.5} /> Save All Grades
              </button>
            )}
            {students.length===0&&<div style={{textAlign:"center",color:C.muted,padding:"40px 0"}}>No students enrolled yet.</div>}
            {students.filter(Boolean).map((s)=>{
              const existing=grades.find(g=>g.student_id===s.id);
              const gf=gradeForm[s.id]||{ca1:existing?.ca1??"",ca2:existing?.ca2??"",midterm:existing?.midterm??"",exam:existing?.exam??""};
              return <Card C={C} key={s.id} style={{padding:16,marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:14,color:C.text}}>{s.name}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Matric: {s.matric}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
                  {[["CA1",20,"ca1"],["CA2",20,"ca2"],["Mid",30,"midterm"],["Exam",60,"exam"]].map(([label,max,key])=>(
                    <div key={key}><div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:4}}>{label}/{max}</div><input type="number" min="0" max={max} value={gf[key]} onChange={(e)=>setGradeForm({...gradeForm,[s.id]:{...gf,[key]:e.target.value}})} style={{...inp,padding:"8px 10px",textAlign:"center"}}/></div>
                  ))}
                </div>
                <button onClick={()=>saveGrades(s.id)} style={{background:C.primary,color:"#fff",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Save Grades</button>
              </Card>;
            })}
          </div>
        )}

        {activeTab === "timetable" && (
          <div>
            <button onClick={() => setShowForm(!showForm)} style={{ display:"flex", alignItems:"center", gap:8, background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"12px 20px", fontWeight:700, cursor:"pointer", marginBottom:16, fontFamily:"Inter,sans-serif" }}>
              <Ic n="plus" s={18} c="#fff" />{showForm ? "Cancel" : "Add Time Slot"}
            </button>
            {showForm && <Card C={C} style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize:12, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Day</label><select style={inp} value={ttForm.day} onChange={(e)=>setTtForm({...ttForm,day:e.target.value})}>{DAYS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div><label style={{ fontSize:12, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Start</label><input style={inp} type="time" value={ttForm.start_time} onChange={(e)=>setTtForm({...ttForm,start_time:e.target.value})}/></div>
                <div><label style={{ fontSize:12, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>End</label><input style={inp} type="time" value={ttForm.end_time} onChange={(e)=>setTtForm({...ttForm,end_time:e.target.value})}/></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize:12, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Venue *</label><input style={inp} value={ttForm.venue} onChange={(e)=>setTtForm({...ttForm,venue:e.target.value})} placeholder="e.g. ICT Hall 1"/></div>
              <button onClick={addTimetableSlot} style={{ background:C.success, color:"#fff", border:"none", borderRadius:12, padding:"12px 0", width:"100%", fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>Add Slot</button>
            </Card>}
            <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>📌 Students enrolled in this course see these slots automatically in their timetable.</div>
            {timetableSlots.length===0&&!showForm&&<div style={{textAlign:"center",color:C.muted,padding:"40px 0"}}>No slots yet.</div>}
            {timetableSlots.map((slot)=>(
              <Card C={C} key={slot.id} style={{ padding:16, marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ textAlign:"center", minWidth:60 }}><div style={{ fontSize:13, fontWeight:700, color:C.primary }}>{slot.start_time}</div><div style={{ fontSize:11, color:C.muted }}>{slot.end_time}</div></div>
                <div style={{ width:3, height:36, background:selected.color||C.primary, borderRadius:3 }}/>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:13, color:C.text }}>{slot.day}</div><div style={{ fontSize:12, color:C.muted }}>📍 {slot.venue}</div></div>
                <button onClick={()=>deleteTimetableSlot(slot.id)} style={{ background:"#FEE2E2", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer" }}><Ic n="trash" s={14} c="#EF4444"/></button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "discussion" && <CourseDiscussion course={selected} user={user} C={C} onCall={setCallType} />}

        {activeTab === "messages" && (
          dmStudent ? (
            <div>
              <button onClick={() => setDmStudent(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", marginBottom: 16, color: C.primary, fontWeight: 700, fontSize: 13, fontFamily: "Inter,sans-serif" }}>
                <Ic n="chevronL" s={16} c={C.primary} /> Back to Students
              </button>
              <DirectMessage course={selected} user={user} C={C} otherUserId={dmStudent.id} otherUserName={dmStudent.name} />
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Student Messages</div>
                <button onClick={loadDmStudents} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: C.muted, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
                  Refresh
                </button>
              </div>
              {dmStudents.length === 0 ? (
                <div style={{ textAlign: "center", color: C.muted, padding: "60px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>No messages yet</div>
                  <div style={{ fontSize: 13 }}>Students who message you will appear here.</div>
                </div>
              ) : (
                dmStudents.map(s => (
                  <Card C={C} key={s.id} onClick={() => setDmStudent(s)} style={{ padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.primary + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Ic n="user" s={18} c={C.primary} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.name}</div>
                      {s.matric && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Matric: {s.matric}</div>}
                    </div>
                    <Ic n="chevronR" s={16} c={C.muted} />
                  </Card>
                ))
              )}
            </div>
          )
        )}

        {activeTab === "attendance" && (
          <div>
            {!takingAttendance ? (
              <div>
                <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                  <button onClick={startAttendance} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.success, color:"#fff", border:"none", borderRadius:12, padding:"12px 10px", fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                    <Ic n="check" s={16} c="#fff" w={2.5} />Manual
                  </button>
                  <button onClick={generateQR} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.info, color:"#fff", border:"none", borderRadius:12, padding:"12px 10px", fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                    <Ic n="qr" s={16} c="#fff" />QR Code
                  </button>
                </div>
                {attendanceSessions.length === 0 && (
                  <div style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                    <div style={{ fontWeight:700, color:C.text, marginBottom:6 }}>No sessions yet</div>
                    <div style={{ fontSize:13 }}>Tap "Take Attendance" to record today's class.</div>
                  </div>
                )}
                {attendanceSessions.map(session => (
                  <Card C={C} key={session.id} style={{ padding:16, marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:8 }}>{session.date}</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <Badge text={`${(session.attendance_records||[]).filter(r=>r.present).length} present`} bg="#D1FAE5" color="#065F46" />
                      <Badge text={`${(session.attendance_records||[]).filter(r=>!r.present).length} absent`} bg="#FEE2E2" color="#EF4444" />
                      <Badge text={`${(session.attendance_records||[]).length} total`} bg={C.bg} color={C.muted} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:4 }}>Mark Attendance</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Tap the toggle to mark a student absent. All students start as present.</div>
                {students.length === 0 && <div style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>No students enrolled.</div>}
                {students.filter(Boolean).map(s => (
                  <Card C={C} key={s.id} style={{ padding:14, marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:C.text }}>{s.name}</div>
                      <div style={{ fontSize:11, color:C.muted }}>Matric: {s.matric}</div>
                    </div>
                    <div
                      onClick={() => setAttendanceMarks(m => ({...m, [s.id]: !m[s.id]}))}
                      style={{ width:32, height:32, borderRadius:10, background:attendanceMarks[s.id]?"#10B981":"transparent", border:`2px solid ${attendanceMarks[s.id]?"#10B981":"#EF4444"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                      {attendanceMarks[s.id] ? <Ic n="check" s={16} c="#fff" w={2.5} /> : <Ic n="x" s={14} c="#EF4444" />}
                    </div>
                  </Card>
                ))}
                <div style={{ display:"flex", gap:10, marginTop:20 }}>
                  <button onClick={() => setTakingAttendance(false)} style={{ flex:1, background:C.card, color:C.muted, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 0", fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>Cancel</button>
                  <button onClick={saveAttendance} style={{ flex:2, background:C.success, color:"#fff", border:"none", borderRadius:12, padding:"13px 0", fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>Save Attendance</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {ToastEl}
      {showQR && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:9998, padding:24 }}>
          <div style={{ background:"#fff", borderRadius:24, padding:28, textAlign:"center", maxWidth:320, width:"100%" }}>
            <div style={{ fontWeight:800, fontSize:18, color:"#1B4332", marginBottom:4 }}>Scan to Mark Attendance</div>
            <div style={{ fontSize:12, color:"#6B6B6B", marginBottom:20 }}>Students: open your phone camera and scan this code</div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width:240, height:240, display:"block", margin:"0 auto 20px", borderRadius:12 }} />}
            <div style={{ fontWeight:800, fontSize:28, color:"#1B4332", letterSpacing:-1 }}>
              {Math.floor(qrTimeLeft/60)}:{String(qrTimeLeft%60).padStart(2,"0")}
            </div>
            <div style={{ fontSize:12, color:"#6B6B6B", marginBottom:24 }}>minutes remaining</div>
            <button onClick={() => { clearInterval(qrIntervalRef.current); setShowQR(false); setQrDataUrl(null); loadAttendance(); }}
              style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:12, padding:"14px 0", width:"100%", fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
              Close QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── MAIN LAYOUT ────────────────────────────────────────
  return (
    <div style={{ fontFamily:"Inter,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background:C.headerBg, color:C.headerText, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-0.3 }}>UniLearn</div>
        <button onClick={()=>setDark(!dark)} style={{ background:"none", border:"none", cursor:"pointer" }}><Ic n={dark?"sun":"moon"} s={20} c={C.headerText}/></button>
      </div>

      <div style={{ padding:"20px", paddingBottom:100 }}>

        {tab === "home" && (
          <div style={{ animation:"fadeIn 0.4s ease" }}>
            <div style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, borderRadius:20, padding:"24px 20px", marginBottom:24, color:"#fff", position:"relative", overflow:"hidden", boxShadow:"0 8px 24px rgba(27,67,50,0.25)" }}>
              <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
              <div style={{ fontSize:11, opacity:0.65, letterSpacing:1, fontWeight:600 }}>{facultyDisplay}</div>
              <div style={{ fontSize:28, fontWeight:800, marginTop:6, letterSpacing:-0.5 }}>{user?.name}</div>
              <div style={{ fontSize:13, opacity:0.7, marginTop:4 }}>Lecturer{user?.department ? ` · ${user.department}` : ""}</div>
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"6px 14px", fontSize:12, fontWeight:600 }}>{courses.length} Course{courses.length!==1?"s":""}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.8, flex:1 }}>MY COURSES</div>
              <button onClick={()=>setShowManageCourses(true)} style={{ display:"flex", alignItems:"center", gap:4, background:C.primary, color:"#fff", border:"none", borderRadius:10, padding:"6px 12px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>
                <Ic n="plus" s={12} c="#fff"/>Add Course
              </button>
            </div>
            {loading ? <Spinner/> : courses.length===0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
                <div style={{ fontWeight:700, marginBottom:8, color:C.text }}>No courses yet</div>
                <div style={{ fontSize:13 }}>You haven't selected courses to teach.</div>
              </div>
            ) : courses.map((c)=>(
              <div key={c.id}
                style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div onClick={()=>{setSelected(c);setActiveTab("materials");}} style={{ display:"flex", alignItems:"center", gap:12, flex:1, cursor:"pointer" }}>
                  <div style={{ width:48, height:48, background:(c.color||"#1B4332")+"15", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}><Ic n="book" s={22} c={c.color||"#1B4332"}/></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{c.code}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{c.title}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{c.level} Level · {c.semester}</div>
                  </div>
                </div>
                <button onClick={()=>removeCourse(c.id)} style={{ background:"#FEE2E2", border:"none", borderRadius:10, padding:"8px 10px", cursor:"pointer", flexShrink:0 }}>
                  <Ic n="trash" s={14} c="#EF4444"/>
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "courses" && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:20, color:C.text, letterSpacing:-0.5 }}>All My Courses</div>
            {courses.map((c)=>(
              <div key={c.id} onClick={()=>{setSelected(c);setActiveTab("materials");setTab("home");}}
                style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ width:48, height:48, background:(c.color||"#1B4332")+"15", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}><Ic n="book" s={22} c={c.color||"#1B4332"}/></div>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{c.code}</div><div style={{ fontSize:12, color:C.muted }}>{c.title}</div><div style={{ fontSize:11, color:C.muted }}>{c.level} Level · {c.semester}</div></div>
                <Ic n="chevronR" s={16} c={C.muted}/>
              </div>
            ))}
          </div>
        )}

        {tab === "announce" && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:20, color:C.text, letterSpacing:-0.5 }}>Announcements</div>
            {message&&<div style={{background:"#D1FAE5",color:"#10B981",padding:"12px 16px",borderRadius:12,marginBottom:16,fontSize:13}}>✓ {message}</div>}
            {error&&<div style={{background:"#FEE2E2",color:"#EF4444",padding:"12px 16px",borderRadius:12,marginBottom:16,fontSize:13}}>{error}</div>}
            <button onClick={()=>setShowForm(!showForm)} style={{ display:"flex", alignItems:"center", gap:8, background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"12px 20px", fontWeight:700, cursor:"pointer", marginBottom:20, fontFamily:"Inter,sans-serif" }}>
              <Ic n="plus" s={18} c="#fff"/>{showForm?"Cancel":"Post Announcement"}
            </button>
            {showForm && <Card C={C} style={{ padding:20, marginBottom:20 }}>
              <div style={{ marginBottom:12 }}><label style={{ fontSize:12, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Title *</label><input style={inp} value={annForm.title} onChange={(e)=>setAnnForm({...annForm,title:e.target.value})} placeholder="Title"/></div>
              <div style={{ marginBottom:12 }}><label style={{ fontSize:12, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Message *</label><textarea style={{...inp,minHeight:100,resize:"none"}} value={annForm.body} onChange={(e)=>setAnnForm({...annForm,body:e.target.value})} placeholder="Write your message..."/></div>
              <div style={{ marginBottom:16 }}><label style={{ fontSize:12, fontWeight:600, color:C.muted, display:"block", marginBottom:6 }}>Priority</label><select style={inp} value={annForm.priority} onChange={(e)=>setAnnForm({...annForm,priority:e.target.value})}><option value="normal">Normal</option><option value="high">High (Urgent)</option></select></div>
              <button onClick={postAnnouncement} style={{ background:C.success, color:"#fff", border:"none", borderRadius:12, padding:"12px 0", width:"100%", fontWeight:700, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>Post</button>
            </Card>}
            {announcements.map((a)=>(
              <Card C={C} key={a.id} style={{ padding:16, marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ flex:1, fontWeight:700, fontSize:14, color:C.text }}>{a.title}</div>
                  {a.priority==="high"&&<Badge text="Urgent" bg="#FEE2E2" color="#EF4444"/>}
                  {a.author_id===user.id && (
                    <button onClick={()=>deleteAnnouncement(a.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                      <Ic n="trash" s={14} c="#EF4444"/>
                    </button>
                  )}
                </div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:10 }}>{a.body}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"#1B433220", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic n="user" s={11} c="#1B4332"/></div>
                  <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{a.profiles?.name||"Lecturer"}</span>
                  <span style={{ fontSize:11, color:C.muted }}>· {new Date(a.created_at).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "messages" && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:20, color:C.text, letterSpacing:-0.5 }}>Messages</div>
            {globalConversations.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
                <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:6 }}>No messages yet</div>
                <div style={{ fontSize:13 }}>When students message you, they'll appear here.</div>
              </div>
            ) : (
              globalConversations.map((convo, i) => (
                <div key={i} onClick={() => {
                  const course = courses.find(c => c.id === convo.course_id);
                  if (course) { setSelected(course); setActiveTab("messages"); setDmStudent(convo.sender); setTab("home"); }
                }}
                style={{ background:C.card, borderRadius:16, padding:14, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:C.primary+"20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Ic n="user" s={20} c={C.primary} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{convo.sender?.name || "Student"}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{timeAgo(convo.created_at)}</div>
                    </div>
                    <div style={{ fontSize:11, color:C.primary, fontWeight:600, marginBottom:2 }}>{convo.course?.code}</div>
                    <div style={{ fontSize:12, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{convo.body}</div>
                  </div>
                  {!convo.read_at && <div style={{ width:8, height:8, borderRadius:"50%", background:"#EF4444", flexShrink:0 }} />}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "more" && (
          <div>
            <Card C={C} style={{ padding:20, marginBottom:16, textAlign:"center" }}>
              <div style={{ position:"relative", width:80, height:80, margin:"0 auto 12px" }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#1B4332,#2D6A4F)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                  {user?.avatar_url?<img src={user.avatar_url} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<Ic n="user" s={32} c="#fff"/>}
                </div>
                <label style={{ position:"absolute", bottom:0, right:0, background:"#F4A261", borderRadius:"50%", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Ic n="camera" s={13} c="#fff"/>
                  <input type="file" style={{display:"none"}} accept="image/*" onChange={uploadAvatar}/>
                </label>
              </div>
              <div style={{ fontWeight:800, fontSize:16, color:C.text }}>{user?.name}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{user?.email}</div>
              <div style={{ fontSize:12, color:C.muted }}>Lecturer{user?.department ? ` · ${user.department}` : ""}</div>
              {uploadingAvatar && <div style={{ fontSize:12, color:C.primary, marginTop:6 }}>Uploading photo...</div>}
              {message && !selected && <div style={{ fontSize:12, color:"#10B981", marginTop:6 }}>✓ {message}</div>}
              {error && !selected && <div style={{ fontSize:12, color:"#EF4444", marginTop:6 }}>{error}</div>}
            </Card>
            <Card C={C} style={{ padding:16, marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:44, height:44, background:C.primary+"18", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}><Ic n={dark?"sun":"moon"} s={20} c={C.primary}/></div>
              <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14, color:C.text }}>{dark?"Light Mode":"Dark Mode"}</div></div>
              <div onClick={()=>setDark(!dark)} style={{ width:50, height:28, borderRadius:14, background:dark?C.primary:C.border, position:"relative", cursor:"pointer", transition:"background 0.3s" }}>
                <div style={{ position:"absolute", top:4, left:dark?26:4, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.3s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
              </div>
            </Card>
            <button
              onClick={async () => { setSigningOut(true); await onLogout(); setSigningOut(false); }}
              disabled={signingOut}
              style={{ background:"#FEE2E2", color:"#EF4444", border:"none", borderRadius:14, padding:"16px 0", width:"100%", fontWeight:700, fontSize:15, cursor:signingOut?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"Inter,sans-serif", marginTop:10, opacity:signingOut?0.7:1 }}>
              <Ic n="logout" s={18} c="#EF4444"/>{signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        )}
      </div>

      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.navBg, backdropFilter:"blur(10px)", borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0", zIndex:100 }}>
        {NAV.map((t)=>{
          const active=tab===t.id;
          const showBadge = t.id === "messages" && globalUnread > 0;
          return <button key={t.id} onClick={()=>{ setTab(t.id); if(t.id==="messages"){ setGlobalUnread(0); loadGlobalConversations(); } }} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:active?C.primary+"18":"transparent", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
              <Ic n={t.icon} s={22} c={active?C.primary:C.muted} w={active?2.2:1.6}/>
              {showBadge && <div style={{ position:"absolute", top:0, right:0, width:16, height:16, borderRadius:"50%", background:"#EF4444", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:9, fontWeight:800, color:"#fff" }}>{globalUnread > 9 ? "9+" : globalUnread}</span></div>}
            </div>
            <span style={{ fontSize:10, fontWeight:active?700:500, color:active?C.primary:C.muted }}>{t.label}</span>
          </button>;
        })}
      </nav>
      {ToastEl}
    </div>
  );
}
