import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase.js";
import { gradeOf, validateFile } from "../../utils/grades.js";
import { ALLOWED_MATERIAL_TYPES, ALLOWED_SUBMISSION_TYPES, MAX_FILE_SIZE_MB } from "../../data.js";
import Ic from "../../components/Ic.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import CourseDiscussion from "../../components/CourseDiscussion.jsx";

export default function Courses({ user, C, onCall }) {
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("materials");
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Assignment state
  const [selAssignment, setSelAssignment] = useState(null);
  const [subFile, setSubFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState({});

  const [showEnroll, setShowEnroll] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("*, courses(*)")
      .eq("student_id", user.id);
    const enrolled = (enrollments || []).map((e) => e.courses).filter(Boolean);
    setCourses(enrolled);
    const { data: all } = await supabase.from("courses").select("*").order("code");
    setAllCourses(all || []);
    setLoading(false);
  };

  useEffect(() => { if (selected) loadData(); }, [selected, activeTab]);

  // Quiz countdown timer — auto-submit on expiry
  useEffect(() => {
    if (!activeQuiz || quizResult) return;
    setTimeLeft(activeQuiz.duration_minutes * 60);
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { clearInterval(t); submitQuiz(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [activeQuiz]);

  const loadData = async () => {
    setMessage(""); setError("");
    if (activeTab === "materials") {
      const { data } = await supabase.from("materials").select("*").eq("course_id", selected.id).order("created_at", { ascending: false });
      setMaterials(data || []);
    }
    if (activeTab === "assignments") {
      const { data: a } = await supabase.from("assignments").select("*").eq("course_id", selected.id).order("due_date");
      setAssignments(a || []);
      const ids = (a || []).map((x) => x.id);
      if (ids.length > 0) {
        const { data: s } = await supabase.from("submissions").select("*").eq("student_id", user.id).in("assignment_id", ids);
        const map = {};
        (s || []).forEach((x) => { map[x.assignment_id] = x; });
        setMySubmissions(map);
      }
    }
    if (activeTab === "quizzes") {
      const { data: q } = await supabase.from("quizzes").select("*").eq("course_id", selected.id);
      setQuizzes(q || []);
      const { data: att } = await supabase.from("quiz_attempts").select("*").eq("student_id", user.id);
      setAttempts(att || []);
    }
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
      course_id: selected.id,
      title: file.name,
      type,
      file_path: urlData.publicUrl,
      file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploaded_by: user.id,
    });
    setMessage("Uploaded successfully!");
    loadData();
    setUploading(false);
  };

  const submitAssignment = async () => {
    if (!subFile) return;
    const err = validateFile(subFile, ALLOWED_SUBMISSION_TYPES, MAX_FILE_SIZE_MB);
    if (err) { setError(err); return; }
    setSubmitting(true);
    const filePath = `submissions/${selAssignment.id}/${user.id}_${Date.now()}_${subFile.name}`;
    const { error: ue } = await supabase.storage.from("unilearn").upload(filePath, subFile);
    if (ue) { setError("Upload failed: " + ue.message); setSubmitting(false); return; }
    const { data: urlData } = supabase.storage.from("unilearn").getPublicUrl(filePath);
    await supabase.from("submissions").upsert({
      assignment_id: selAssignment.id,
      student_id: user.id,
      file_path: urlData.publicUrl,
      file_name: subFile.name,
      submitted_at: new Date().toISOString(),
    });
    setMessage("Submitted successfully!");
    setSubFile(null);
    setSelAssignment(null);
    loadData();
    setSubmitting(false);
  };

  const submitQuiz = async () => {
    let score = 0;
    activeQuiz.questions.forEach((q, i) => { if (answers[i] === q.answer) score++; });
    await supabase.from("quiz_attempts").upsert({
      quiz_id: activeQuiz.id,
      student_id: user.id,
      score,
      total: activeQuiz.questions.length,
      answers: JSON.stringify(answers),
      submitted_at: new Date().toISOString(),
    });
    setQuizResult({ score, total: activeQuiz.questions.length, answers: { ...answers } });
  };

  const enrollInCourse = async (courseId) => {
    await supabase.from("enrollments").upsert({ student_id: user.id, course_id: courseId }, { onConflict: "student_id,course_id" });
    loadCourses();
  };

  const unenroll = async (courseId) => {
    await supabase.from("enrollments").delete().eq("student_id", user.id).eq("course_id", courseId);
    loadCourses();
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const filtered = courses.filter((c) => !search || c.code?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase()));

  // ── ASSIGNMENT SUBMISSION SCREEN ───────────────────────
  if (selAssignment) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => { setSelAssignment(null); setSubFile(null); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n="chevronL" s={22} c={C.primary} />
        </button>
        <div style={{ flex: 1, fontWeight: 800, fontSize: 16, color: C.text }}>{selAssignment.title}</div>
      </div>
      {message && <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>✓ {message}</div>}
      {error && <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>{error}</div>}
      <div style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 12 }}>{selAssignment.description || "Submit your work for this assignment."}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge text={`Due: ${selAssignment.due_date}`} bg={C.bg} color={C.muted} />
          <Badge text={`${selAssignment.max_score} marks`} bg="#EFF6FF" color="#3B82F6" />
        </div>
      </div>
      {mySubmissions[selAssignment.id] ? (
        <div style={{ background: "#D1FAE5", borderRadius: 16, padding: 20, border: "1px solid #A7F3D0" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#065F46", marginBottom: 8 }}>✓ Already Submitted</div>
          <div style={{ fontSize: 13, color: "#065F46" }}>File: {mySubmissions[selAssignment.id].file_name}</div>
          {mySubmissions[selAssignment.id].score !== null ? (
            <div style={{ marginTop: 12, background: "#fff", borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, color: "#10B981", fontSize: 16 }}>
                Score: {mySubmissions[selAssignment.id].score}/{selAssignment.max_score}
              </div>
              {mySubmissions[selAssignment.id].feedback && (
                <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 6 }}>
                  Feedback: {mySubmissions[selAssignment.id].feedback}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#065F46", marginTop: 8 }}>Awaiting grading…</div>
          )}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16 }}>Submit Assignment</div>
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setSubFile(e.target.files[0])} />
          {subFile ? (
            <div style={{ background: C.bg, borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <Ic n="file" s={22} c={C.primary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{subFile.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{(subFile.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <button onClick={() => setSubFile(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Ic n="x" s={18} c={C.danger} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current.click()}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "28px 0", border: `2px dashed ${C.border}`, borderRadius: 14,
                background: C.bg, cursor: "pointer", marginBottom: 16, gap: 8,
              }}
            >
              <Ic n="upload" s={28} c={C.muted} />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Tap to choose file</div>
              <div style={{ fontSize: 11, color: C.muted }}>PDF, DOC, ZIP (max {MAX_FILE_SIZE_MB}MB)</div>
            </button>
          )}
          <button
            onClick={submitAssignment}
            disabled={!subFile || submitting}
            style={{
              background: subFile ? C.primary : C.border,
              color: subFile ? "#fff" : C.muted,
              border: "none", borderRadius: 12, padding: "14px 0", width: "100%",
              fontWeight: 700, fontSize: 14, cursor: subFile ? "pointer" : "default",
              fontFamily: "Inter,sans-serif",
            }}
          >
            {submitting ? "Submitting..." : subFile ? "Submit Assignment" : "Choose a File First"}
          </button>
        </div>
      )}
    </div>
  );

  // ── QUIZ IN PROGRESS ───────────────────────────────────
  if (activeQuiz && !quizResult) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => setActiveQuiz(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n="chevronL" s={22} c={C.primary} />
        </button>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: C.text }}>{activeQuiz.title}</div>
        <div style={{
          background: timeLeft < 60 ? "#FEE2E2" : "#D1FAE5",
          color: timeLeft < 60 ? "#EF4444" : "#065F46",
          padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700,
        }}>
          ⏱ {fmt(timeLeft)}
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ background: C.card, borderRadius: 12, padding: "8px 14px", marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ background: C.border, borderRadius: 10, height: 6, overflow: "hidden" }}>
          <div style={{ background: C.primary, height: "100%", width: `${(Object.keys(answers).length / activeQuiz.questions.length) * 100}%`, borderRadius: 10, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: "center" }}>
          {Object.keys(answers).length} of {activeQuiz.questions.length} answered
        </div>
      </div>
      {/* Questions */}
      {activeQuiz.questions.map((q, qi) => (
        <div key={qi} style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, lineHeight: 1.5, color: C.text }}>
            Q{qi + 1}. {q.q}
          </div>
          {q.options.map((opt, oi) => (
            <div
              key={oi}
              onClick={() => setAnswers({ ...answers, [qi]: oi })}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12, marginBottom: 8,
                background: answers[qi] === oi ? C.primary + "15" : C.bg,
                border: `2px solid ${answers[qi] === oi ? C.primary : C.border}`,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${answers[qi] === oi ? C.primary : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {answers[qi] === oi && <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.primary }} />}
              </div>
              <span style={{ fontSize: 14, color: C.text }}>{opt}</span>
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={submitQuiz}
        style={{
          background: C.primary, color: "#fff", border: "none", borderRadius: 14,
          padding: "16px 0", width: "100%", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "Inter,sans-serif", marginBottom: 40,
        }}
      >
        Submit Quiz ({Object.keys(answers).length}/{activeQuiz.questions.length} answered)
      </button>
    </div>
  );

  // ── QUIZ RESULT WITH ANSWER REVIEW ────────────────────
  if (quizResult) {
    const pct = Math.round((quizResult.score / quizResult.total) * 100);
    const g = gradeOf(pct);
    const emoji = pct === 100 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "👍" : "📚";
    return (
      <div style={{ paddingBottom: 40 }}>
        <div style={{ textAlign: "center", paddingTop: 32, paddingBottom: 24 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{emoji}</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: g.color, letterSpacing: -2 }}>{pct}%</div>
          <div style={{ fontSize: 18, color: C.muted, marginTop: 8 }}>
            {quizResult.score} of {quizResult.total} correct
          </div>
          <div style={{ background: C.card, borderRadius: 20, padding: 24, margin: "24px 0", border: `1px solid ${C.border}` }}>
            <div style={{ background: C.border, borderRadius: 20, height: 12, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ background: g.color, height: "100%", width: `${pct}%`, borderRadius: 20, transition: "width 1s ease" }} />
            </div>
            <div style={{ fontSize: 14, color: C.muted }}>
              {pct === 100 ? "Perfect score! Outstanding performance." : pct >= 70 ? "Great job! Above average." : pct >= 50 ? "You passed. Keep studying." : "Below pass mark. Review the material."}
            </div>
          </div>
        </div>

        {/* Answer Review — new feature */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>📋 Answer Review</div>
          {activeQuiz.questions.map((q, qi) => {
            const userAnswer = quizResult.answers[qi];
            const correct = userAnswer === q.answer;
            return (
              <div key={qi} style={{
                background: C.card, borderRadius: 14, padding: 16, marginBottom: 10,
                border: `2px solid ${correct ? "#10B981" : "#EF4444"}`,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 10 }}>
                  Q{qi + 1}. {q.q}
                </div>
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answer;
                  const isUser = oi === userAnswer;
                  let bg = C.bg, borderColor = C.border, textColor = C.text;
                  if (isCorrect) { bg = "#D1FAE5"; borderColor = "#10B981"; textColor = "#065F46"; }
                  else if (isUser && !isCorrect) { bg = "#FEE2E2"; borderColor = "#EF4444"; textColor = "#991B1B"; }
                  return (
                    <div key={oi} style={{
                      padding: "10px 14px", borderRadius: 10, marginBottom: 6,
                      background: bg, border: `1.5px solid ${borderColor}`,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      {isCorrect && <Ic n="check" s={16} c="#10B981" w={2.5} />}
                      {isUser && !isCorrect && <Ic n="x" s={16} c="#EF4444" w={2.5} />}
                      {!isCorrect && !isUser && <div style={{ width: 16 }} />}
                      <span style={{ fontSize: 13, color: textColor, fontWeight: isCorrect ? 700 : 400 }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => { setQuizResult(null); setActiveQuiz(null); setAnswers({}); }}
          style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "16px 0", width: "100%", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (loading) return <Spinner />;

  // ── ADD COURSES SCREEN ────────────────────────────────
  if (showEnroll) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => { setShowEnroll(false); setSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n="chevronL" s={22} c={C.primary} />
        </button>
        <div style={{ flex: 1, fontSize: 20, fontWeight: 800, color: C.text }}>Add Courses</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: `1px solid ${C.border}` }}>
        <Ic n="search" s={18} c={C.muted} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search all courses..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: C.text, outline: "none", fontFamily: "Inter,sans-serif" }} />
      </div>
      {allCourses.filter((c) => !search || c.code?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase())).map((c) => {
        const enrolled = courses.find((x) => x.id === c.id);
        return (
          <div key={c.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, background: (c.color || "#1B4332") + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic n="book" s={20} c={c.color || "#1B4332"} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{c.code}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{c.title}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{c.department} · {c.units} units</div>
            </div>
            <button
              onClick={() => enrolled ? unenroll(c.id) : enrollInCourse(c.id)}
              style={{
                background: enrolled ? "#FEE2E2" : C.primary,
                color: enrolled ? "#EF4444" : "#fff",
                border: "none", borderRadius: 10, padding: "8px 16px",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              {enrolled ? "Remove" : "Add"}
            </button>
          </div>
        );
      })}
    </div>
  );

  // ── COURSE DETAIL ─────────────────────────────────────
  if (selected) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => { setSelected(null); setMessage(""); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Ic n="chevronL" s={22} c={C.primary} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{selected.code}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{selected.title}</div>
        </div>
        <Badge text={`${selected.units}u`} bg={(selected.color || "#1B4332") + "18"} color={selected.color || "#1B4332"} />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {[["materials", "file", "Materials"], ["assignments", "clip", "Tasks"], ["quizzes", "chart", "Quizzes"], ["discussion", "send", "Forum"]].map(([t, icon, label]) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "8px 14px", borderRadius: 12, border: "none",
              background: activeTab === t ? C.primary : C.card,
              cursor: "pointer", flexShrink: 0,
            }}
          >
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
              <div style={{ width: 44, height: 44, background: m.type === "PDF" ? "#EF444418" : m.type === "Video" ? "#3B82F618" : "#F59E0B18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic n="file" s={20} c={m.type === "PDF" ? "#EF4444" : m.type === "Video" ? "#3B82F6" : "#F59E0B"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.type} · {m.file_size}</div>
              </div>
              <a href={m.file_path} target="_blank" rel="noreferrer" style={{ background: C.primary, color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                Open
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Assignments */}
      {activeTab === "assignments" && (
        <div>
          {assignments.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No assignments posted yet.</div>}
          {assignments.map((a) => {
            const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
            const overdue = days < 0;
            const mySub = mySubmissions[a.id];
            return (
              <div
                key={a.id}
                onClick={() => setSelAssignment(a)}
                style={{
                  background: C.card, borderRadius: 16, padding: 16, marginBottom: 10,
                  border: `1px solid ${C.border}`, cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 8 }}>{a.title}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {mySub ? (
                    <Badge text={mySub.score !== null ? `Graded: ${mySub.score}/${a.max_score}` : "Submitted ✓"} bg="#D1FAE5" color="#065F46" />
                  ) : (
                    <Badge text={overdue ? "Overdue" : `${days}d left`} bg={overdue ? "#FEE2E2" : days < 3 ? "#FEF3C7" : "#D1FAE5"} color={overdue ? "#EF4444" : days < 3 ? "#92400E" : "#065F46"} />
                  )}
                  <Badge text={`${a.max_score} marks`} bg="#EFF6FF" color="#3B82F6" />
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: C.muted }}>
                    <span style={{ fontSize: 12 }}>{mySub ? "View" : "Submit"}</span>
                    <Ic n="chevronR" s={14} c={C.muted} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quizzes */}
      {activeTab === "quizzes" && (
        <div>
          {quizzes.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No quizzes yet.</div>}
          {quizzes.map((q) => {
            const attempt = attempts.find((a) => a.quiz_id === q.id);
            const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : null;
            const g = pct !== null ? gradeOf(pct) : null;
            return (
              <div key={q.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: "#8B5CF618", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ic n="chart" s={20} c="#8B5CF6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{q.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                      {q.questions?.length || 0} questions · {q.duration_minutes} min
                    </div>
                    {attempt && (
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Badge text={`${attempt.score}/${attempt.total} · ${pct}%`} bg={g.color + "20"} color={g.color} />
                        <Badge text={`Grade ${g.letter}`} bg={g.color + "20"} color={g.color} />
                      </div>
                    )}
                  </div>
                  {attempt ? (
                    <button
                      onClick={() => {
                        const savedAnswers = attempt.answers ? JSON.parse(attempt.answers) : {};
                        setActiveQuiz(q);
                        setQuizResult({ score: attempt.score, total: attempt.total, answers: savedAnswers });
                      }}
                      style={{ background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                    >
                      Review
                    </button>
                  ) : (
                    <button
                      onClick={() => { setActiveQuiz(q); setAnswers({}); setQuizResult(null); }}
                      style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Discussion */}
      {activeTab === "discussion" && (
        <CourseDiscussion course={selected} user={user} C={C} onCall={onCall} />
      )}
    </div>
  );

  // ── COURSE LIST ────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, flex: 1, letterSpacing: -0.5 }}>My Courses</div>
        <button
          onClick={() => { setShowEnroll(true); setSearch(""); }}
          style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Ic n="plus" s={14} c="#fff" /> Add
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: `1px solid ${C.border}` }}>
        <Ic n="search" s={18} c={C.muted} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your courses..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: C.text, outline: "none", fontFamily: "Inter,sans-serif" }} />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer" }}><Ic n="x" s={16} c={C.muted} /></button>}
      </div>
      {courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No courses yet</div>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Add your registered courses to get started</div>
          <button onClick={() => setShowEnroll(true)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Browse Courses</button>
        </div>
      ) : (
        filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => { setSelected(c); setActiveTab("materials"); }}
            style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          >
            <div style={{ width: 48, height: 48, background: (c.color || "#1B4332") + "18", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic n="book" s={22} c={c.color || "#1B4332"} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{c.code}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{c.title}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <Badge text={`${c.units}u`} bg={(c.color || "#1B4332") + "18"} color={c.color || "#1B4332"} />
              <Ic n="chevronR" s={16} c={C.muted} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
