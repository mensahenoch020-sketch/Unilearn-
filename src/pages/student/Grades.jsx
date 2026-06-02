import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import { gradeOf } from "../../utils/grades.js";
import Spinner from "../../components/Spinner.jsx";

export default function Grades({ user, C }) {
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animCGPA, setAnimCGPA] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: g } = await supabase.from("grades").select("*").eq("student_id", user.id);
      const { data: enr } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user.id);
      const enrolled = (enr || []).map((e) => e.courses).filter(Boolean);
      setGrades(g || []);
      setCourses(enrolled);
      setLoading(false);
    };
    load();
  }, []);

  const calcTotal = (g) =>
    g.exam !== null ? (g.ca1 || 0) + (g.ca2 || 0) + (g.midterm || 0) + g.exam : null;

  const graded = grades.filter((g) => calcTotal(g) !== null);

  const cgpa =
    graded.length > 0
      ? graded.reduce((sum, g) => {
          const total = calcTotal(g);
          const { gp } = gradeOf(total);
          const course = courses.find((c) => c.id === g.course_id);
          return sum + gp * (course?.units || 3);
        }, 0) /
        graded.reduce((sum, g) => {
          const course = courses.find((c) => c.id === g.course_id);
          return sum + (course?.units || 3);
        }, 0)
      : 0;

  // Animate CGPA number on load
  useEffect(() => {
    if (loading) return;
    let start = 0;
    const step = cgpa / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= cgpa) {
        setAnimCGPA(cgpa);
        clearInterval(timer);
      } else {
        setAnimCGPA(start);
      }
    }, 1500 / 60);
    return () => clearInterval(timer);
  }, [loading, cgpa]);

  const cgpaClass =
    cgpa >= 4.5
      ? "First Class Honours"
      : cgpa >= 3.5
      ? "Second Class Upper"
      : cgpa >= 2.5
      ? "Second Class Lower"
      : cgpa >= 1.5
      ? "Third Class"
      : cgpa > 0
      ? "Pass"
      : "No grades yet";

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text, letterSpacing: -0.5 }}>
        Academic Results
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
        2024/2025 · {user?.semester || ""} Semester
      </div>

      {/* CGPA Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          borderRadius: 20,
          padding: "24px 20px",
          marginBottom: 20,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 500, letterSpacing: 0.5 }}>CURRENT CGPA</div>
        <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -3, marginTop: 8, lineHeight: 1 }}>
          {animCGPA.toFixed(2)}
        </div>
        <div style={{ fontSize: 16, opacity: 0.85, marginTop: 8, fontWeight: 600 }}>{cgpaClass}</div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 20,
            height: 8,
            marginTop: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.9)",
              height: "100%",
              width: `${(cgpa / 5) * 100}%`,
              borderRadius: 20,
              transition: "width 1.5s ease",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.6, marginTop: 4 }}>
          <span>0.0</span><span>2.5</span><span>5.0</span>
        </div>
      </div>

      {grades.length === 0 && (
        <div style={{ textAlign: "center", color: C.muted, padding: "40px 0", fontSize: 14 }}>
          No grades recorded yet. Check back after assessments.
        </div>
      )}

      {grades.map((g) => {
        const total = calcTotal(g);
        const grade = total !== null ? gradeOf(total) : null;
        const course = courses.find((c) => c.id === g.course_id);
        return (
          <div
            key={g.id}
            style={{
              background: C.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{course?.code}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{course?.title}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {grade && (
                  <>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: grade.color + "20",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontWeight: 900, fontSize: 16, color: grade.color }}>{grade.letter}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: grade.color }}>{total}/100</div>
                      <div style={{ fontSize: 11, color: C.muted }}>GP: {grade.gp.toFixed(1)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              {[["CA1", g.ca1, 20], ["CA2", g.ca2, 20], ["Mid", g.midterm, 30], ["Exam", g.exam, 60]].map(
                ([label, value, max]) => (
                  <div
                    key={label}
                    style={{ background: C.bg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}
                  >
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>
                      {label}/{max}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: value !== null ? C.text : C.border,
                        marginTop: 4,
                      }}
                    >
                      {value !== null ? value : "–"}
                    </div>
                  </div>
                )
              )}
            </div>

            {total !== null && (
              <div style={{ background: C.border, borderRadius: 10, height: 6, overflow: "hidden" }}>
                <div
                  style={{
                    background: grade?.color,
                    height: "100%",
                    width: `${total}%`,
                    borderRadius: 10,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
