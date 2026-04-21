import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "./supabase.js";
import { LIGHT, DARK } from "./theme.js";
import Ic from "./components/Ic.jsx";
import Auth from "./pages/Auth.jsx";
import CourseEnrollment from "./pages/CourseEnrollment.jsx";
import StudentApp from "./pages/student/StudentApp.jsx";
import LecturerApp from "./pages/lecturer/LecturerApp.jsx";

// ── SPLASH SCREEN ──────────────────────────────────────────
function SplashScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1B4332 0%, #2D6A4F 60%, #1B4332 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        fontFamily: "Inter,sans-serif",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 72,
          height: 72,
          background: "#F4A261",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ic n="book" s={34} c="#fff" w={2} />
      </div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>UniLearn</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>University of Ilorin</div>
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid rgba(255,255,255,0.2)",
          borderTop: "3px solid #fff",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          marginTop: 8,
        }}
      />
    </div>
  );
}

// ── ROOT APP ───────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("unilearn-dark") === "true");
  const [loading, setLoading] = useState(true);
  const [showEnrollment, setShowEnrollment] = useState(false);

  const C = dark ? DARK : LIGHT;

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem("unilearn-dark", dark);
  }, [dark]);

  // Session restoration
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser(profile);
        if (profile?.role === "student") {
          const { data: enr } = await supabase
            .from("enrollments")
            .select("id")
            .eq("student_id", profile.id);
          if (!enr || enr.length === 0) setShowEnrollment(true);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (profile) => {
    setUser(profile);
    if (profile?.role === "student") {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", profile.id);
      if (!enr || enr.length === 0) setShowEnrollment(true);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setShowEnrollment(false);
    }
  };

  if (loading) return <SplashScreen />;
  if (!user) return <Auth onLogin={handleLogin} />;
  if (user.role === "lecturer") {
    return (
      <LecturerApp
        user={user}
        setUser={setUser}
        dark={dark}
        setDark={setDark}
        C={C}
        onLogout={handleLogout}
      />
    );
  }
  if (showEnrollment) {
    return <CourseEnrollment user={user} onDone={() => setShowEnrollment(false)} />;
  }

  // Student app — wrapped with BrowserRouter for URL-based navigation
  return (
    <BrowserRouter>
      <StudentApp
        user={user}
        setUser={setUser}
        dark={dark}
        setDark={setDark}
        C={C}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
}
