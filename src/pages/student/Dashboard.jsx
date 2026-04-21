import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase.js";
import Ic from "../../components/Ic.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function Dashboard({ user, C }) {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const load = async () => {
      const { data: ann } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: enr } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user.id);
      const enrolled = (enr || []).map((e) => e.courses).filter(Boolean);
      setEnrolledCourses(enrolled);

      if (enrolled.length > 0) {
        const ids = enrolled.map((c) => c.id);
        const { data: asgn } = await supabase
          .from("assignments")
          .select("*, courses(code, color)")
          .in("course_id", ids)
          .order("due_date");
        const upcoming = (asgn || []).filter((a) => {
          const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
          return days >= 0 && days <= 7;
        });
        setUpcomingDeadlines(upcoming);
      }

      setAnnouncements(ann || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  const quickStats = [
    { label: "My Courses", value: enrolledCourses.length, color: "#3B82F6", bg: "#EFF6FF", icon: "book", path: "/courses" },
    { label: "Timetable", value: "View", color: "#10B981", bg: "#D1FAE5", icon: "calendar", path: "/timetable" },
    { label: "Grades", value: "CGPA", color: "#F59E0B", bg: "#FEF3C7", icon: "chart", path: "/grades" },
    { label: "Attendance", value: "Track", color: "#EF4444", bg: "#FEE2E2", icon: "users", path: "/attendance" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Hero banner */}
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
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 500, letterSpacing: 0.5 }}>
          FACULTY OF {user?.faculty?.toUpperCase()}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{greeting} 👋</div>
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, letterSpacing: -0.5 }}>{user?.name}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          {user?.department} · {user?.level}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>
            {enrolledCourses.length} Courses
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>
            {upcomingDeadlines.length} Due soon
          </div>
        </div>
      </div>

      {/* Quick stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {quickStats.map((s) => (
          <div
            key={s.label}
            onClick={() => navigate(s.path)}
            style={{
              background: C.card,
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${C.border}`,
              cursor: "pointer",
            }}
          >
            <div style={{ width: 36, height: 36, background: s.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Ic n={s.icon} s={18} c={s.color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {enrolledCourses.length === 0 && (
        <div style={{ background: C.card, borderRadius: 16, padding: 24, marginBottom: 20, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>Add your courses</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Go to the Courses tab to enroll</div>
          <button onClick={() => navigate("/courses")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
            Browse Courses
          </button>
        </div>
      )}

      {/* Upcoming deadlines */}
      {upcomingDeadlines.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: C.muted, letterSpacing: 0.5 }}>⏰ DUE THIS WEEK</div>
          {upcomingDeadlines.map((a) => {
            const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
            return (
              <div
                key={a.id}
                onClick={() => navigate("/courses")}
                style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              >
                <div style={{ width: 36, height: 36, background: (a.courses?.color || "#999") + "18", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n="clip" s={16} c={a.courses?.color || "#999"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.courses?.code} · Due {a.due_date}</div>
                </div>
                <Badge text={days === 0 ? "Today" : `${days}d`} bg={days <= 2 ? "#FEE2E2" : "#FEF3C7"} color={days <= 2 ? "#EF4444" : "#92400E"} />
              </div>
            );
          })}
        </>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, marginTop: 8, color: C.muted, letterSpacing: 0.5 }}>📢 ANNOUNCEMENTS</div>
          {announcements.map((a) => (
            <div key={a.id} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, flex: 1 }}>{a.title}</div>
                {a.priority === "high" && <Badge text="Urgent" bg="#FEE2E2" color="#EF4444" />}
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{a.body}</div>
            </div>
          ))}
        </>
      )}

      {/* Enrolled courses */}
      {enrolledCourses.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, marginTop: 8, color: C.muted, letterSpacing: 0.5 }}>MY COURSES</div>
          {enrolledCourses.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate("/courses")}
              style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            >
              <div style={{ width: 44, height: 44, background: c.color + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic n="book" s={20} c={c.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{c.code}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.title}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge text={`${c.units}u`} bg={c.color + "18"} color={c.color} />
                <Ic n="chevronR" s={16} c={C.muted} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
