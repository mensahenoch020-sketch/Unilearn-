import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import Spinner from "../../components/Spinner.jsx";

export default function Attendance({ user, C }) {
  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user.id);
      const enrolled = (enr || []).map((e) => e.courses).filter(Boolean);

      const { data: s } = await supabase.from("attendance_sessions").select("*");
      const { data: r } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("student_id", user.id);

      setCourses(enrolled);
      setSessions(s || []);
      setRecords(r || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  // Overall attendance calculation
  const totalSessions = sessions.length;
  const totalAttended = records.filter((r) => r.present).length;
  const overallPct = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text, letterSpacing: -0.5 }}>
        Attendance
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
        Your attendance record this semester
      </div>

      {/* Overall summary card */}
      {totalSessions > 0 && (
        <div
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
            borderRadius: 20,
            padding: "20px",
            marginBottom: 20,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: 0.5 }}>OVERALL ATTENDANCE</div>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2, marginTop: 4 }}>{overallPct}%</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            {totalAttended} of {totalSessions} total classes
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, height: 8, marginTop: 14, overflow: "hidden" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.9)",
                height: "100%",
                width: `${overallPct}%`,
                borderRadius: 10,
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div style={{ textAlign: "center", color: C.muted, padding: "40px 0", fontSize: 14 }}>
          No courses enrolled. Enroll in courses to track attendance.
        </div>
      )}

      {/* Per-course breakdown */}
      {courses.map((c) => {
        const courseSessions = sessions.filter((s) => s.course_id === c.id);
        const attended = records.filter(
          (r) => courseSessions.find((s) => s.id === r.session_id) && r.present
        ).length;
        const total = courseSessions.length || 0;
        const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
        const color = pct < 75 ? "#EF4444" : "#10B981";

        return (
          <div
            key={c.id}
            style={{
              background: C.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              border: `1px solid ${pct > 0 && pct < 75 ? "#EF444440" : C.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{c.code}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.title}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{total > 0 ? `${pct}%` : "—"}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {total > 0 ? `${attended}/${total} classes` : "No sessions yet"}
                </div>
              </div>
            </div>

            {total > 0 && (
              <div style={{ background: C.border, borderRadius: 10, height: 8, overflow: "hidden" }}>
                <div
                  style={{
                    background: color,
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: 10,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            )}

            {pct > 0 && pct < 75 && (
              <div style={{ fontSize: 12, color: "#EF4444", marginTop: 8, fontWeight: 600 }}>
                ⚠️ Below 75% minimum — you risk being barred from exams
              </div>
            )}
          </div>
        );
      })}

      {/* Policy notice */}
      <div
        style={{
          background: "#FEF3C7",
          borderRadius: 14,
          padding: 16,
          border: "1px solid #FDE68A",
          marginTop: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: "#92400E", marginBottom: 4 }}>
          University Attendance Policy
        </div>
        <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
          Students must maintain a minimum of 75% attendance per course to be eligible to sit for semester examinations.
        </div>
      </div>
    </div>
  );
}
