import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabase.js";
import { playNotif } from "../../utils/sound.js";
import Ic from "../../components/Ic.jsx";
import CallScreen from "../../components/CallScreen.jsx";
import Dashboard from "./Dashboard.jsx";
import Courses from "./Courses.jsx";
import Grades from "./Grades.jsx";
import Timetable from "./Timetable.jsx";
import Attendance from "./Attendance.jsx";
import Settings from "./Settings.jsx";
import More from "./More.jsx";
import Notifications from "./Notifications.jsx";
import MessagesInbox from "./MessagesInbox.jsx";
import AppGuide from "./AppGuide.jsx";

const NAV = [
  { path: "/", icon: "home", label: "Home" },
  { path: "/courses", icon: "book", label: "Courses" },
  { path: "/grades", icon: "chart", label: "Grades" },
  { path: "/messages-inbox", icon: "msg", label: "Messages" },
  { path: "/more", icon: "more", label: "More" },
];

const BOTTOM_NAV_PATHS = ["/", "/courses", "/grades", "/messages-inbox", "/more"];

export default function StudentApp({ user, setUser, dark, setDark, C, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [callType, setCallType] = useState(null);
  const [deadlineCount, setDeadlineCount] = useState(0);
  const [dmCount, setDmCount] = useState(0);

  // Initial badge counts
  useEffect(() => {
    const fetchCounts = async () => {
      const { data: enr } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
      const ids = (enr || []).map(e => e.course_id);

      // Deadline badge on Home
      if (ids.length > 0) {
        const { data: asgn } = await supabase.from("assignments").select("due_date").in("course_id", ids);
        const count = (asgn || []).filter(a => {
          const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
          return days >= 0 && days <= 3;
        }).length;
        setDeadlineCount(count);
      }

      // Unread DM badge on Messages tab
      const { count: unread } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);
      setDmCount(unread || 0);
    };
    fetchCounts();
  }, [user.id]);

  // Real-time listener: update badge + play sound when a new DM arrives
  useEffect(() => {
    const ch = supabase
      .channel(`student_unread_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        // Only play sound if user is NOT currently on the messages page
        if (!window.location.pathname.includes("messages")) {
          playNotif();
        }
        setDmCount(c => c + 1);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "direct_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        // Refresh count after messages are marked read
        supabase
          .from("direct_messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .is("read_at", null)
          .then(({ count }) => setDmCount(count || 0));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user.id]);

  if (callType) return <CallScreen callType={callType} onClose={() => setCallType(null)} />;

  const showBottomNav = BOTTOM_NAV_PATHS.includes(pathname);

  const handleLogout = async () => {
    await onLogout();
    navigate("/");
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Top header */}
      <div style={{
        background: C.headerBg, color: C.headerText, padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!showBottomNav && (
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <Ic n="chevronL" s={22} c={C.headerText} />
            </button>
          )}
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>UniLearn</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Ic n={dark ? "sun" : "moon"} s={20} c={C.headerText} />
          </button>
          {user?.avatar_url && (
            <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden" }}>
              <img src={user.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: "20px 20px", paddingBottom: showBottomNav ? 100 : 40 }}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} C={C} />} />
          <Route path="/courses" element={<Courses user={user} C={C} onCall={setCallType} />} />
          <Route path="/grades" element={<Grades user={user} C={C} />} />
          <Route path="/timetable" element={<Timetable user={user} C={C} />} />
          <Route path="/attendance" element={<Attendance user={user} C={C} />} />
          <Route path="/settings" element={<Settings user={user} setUser={setUser} C={C} onLogout={handleLogout} />} />
          <Route path="/more" element={<More user={user} dark={dark} setDark={setDark} onLogout={handleLogout} C={C} />} />
          <Route path="/notifications" element={<Notifications user={user} C={C} />} />
          <Route path="/messages-inbox" element={<MessagesInbox user={user} C={C} onRead={() => setDmCount(0)} />} />
          <Route path="/app-guide" element={<AppGuide C={C} />} />
          <Route path="*" element={<Dashboard user={user} C={C} />} />
        </Routes>
      </div>

      {/* Bottom nav */}
      {showBottomNav && (
        <nav style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, background: C.navBg, backdropFilter: "blur(12px)",
          borderTop: `1px solid ${C.border}`, display: "flex",
          padding: "8px 0 env(safe-area-inset-bottom)", zIndex: 100,
        }}>
          {NAV.map((t) => {
            const active = pathname === t.path;
            const badge = t.path === "/" ? deadlineCount : t.path === "/messages-inbox" ? dmCount : 0;
            return (
              <button
                key={t.path}
                onClick={() => {
                  navigate(t.path);
                  if (t.path === "/messages-inbox") setDmCount(0);
                }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                }}
              >
                <div style={{
                  width: 40, height: 34, borderRadius: 10,
                  background: active ? C.primary + "18" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s", position: "relative",
                }}>
                  <Ic n={t.icon} s={22} c={active ? C.primary : C.muted} w={active ? 2.2 : 1.6} />
                  {badge > 0 && (
                    <div style={{
                      position: "absolute", top: 2, right: 4,
                      background: "#EF4444", borderRadius: "50%",
                      width: 16, height: 16, fontSize: 9, fontWeight: 800,
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {badge > 9 ? "9+" : badge}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.primary : C.muted }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
