import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "./supabase.js";
import { LIGHT, DARK } from "./theme.js";
import Ic from "./components/Ic.jsx";
import Auth from "./pages/Auth.jsx";
import CourseEnrollment from "./pages/CourseEnrollment.jsx";
import StudentApp from "./pages/student/StudentApp.jsx";
import LecturerApp from "./pages/lecturer/LecturerApp.jsx";
import LecturerCourseEnrollment from "./pages/lecturer/LecturerCourseEnrollment.jsx";
import Onboarding from "./pages/student/Onboarding.jsx";

function SplashScreen() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);

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
          boxShadow: "0 8px 32px rgba(244,162,97,0.4)",
        }}
      >
        <Ic n="book" s={34} c="#fff" w={2} />
      </div>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>UniLearn</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>University of Ilorin</div>
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid rgba(255,255,255,0.2)",
          borderTop: "3px solid #fff",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          marginTop: 8,
        }}
      />
      {slow && (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>
          Taking longer than usual…
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("unilearn-dark") === "true");
  const [loading, setLoading] = useState(true);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showLecturerEnrollment, setShowLecturerEnrollment] = useState(false);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("unilearn-onboarded") === "true");

  const C = dark ? DARK : LIGHT;

  useEffect(() => {
    localStorage.setItem("unilearn-dark", dark);
  }, [dark]);

  useEffect(() => {
    const init = async () => {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 8000)
        );
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeout,
        ]);
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (profile) {
            setUser(profile);
            await checkEnrollments(profile);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setShowEnrollment(false);
        setShowLecturerEnrollment(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUser(profile);
          if (event === "SIGNED_IN") {
            await checkEnrollments(profile);
          }
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkEnrollments = async (profile) => {
    if (!profile) return;
    try {
      if (profile.role === "student") {
        const { data: enr } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", profile.id);
        if (!enr || enr.length === 0) setShowEnrollment(true);
      } else if (profile.role === "lecturer") {
        const { data: lc } = await supabase
          .from("lecturer_courses")
          .select("id")
          .eq("lecturer_id", profile.id);
        if (!lc || lc.length === 0) setShowLecturerEnrollment(true);
      }
    } catch (err) {
      console.error("checkEnrollments error:", err);
    }
  };

  const handleLogin = async (profile) => {
    setUser(profile);
    await checkEnrollments(profile);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setShowEnrollment(false);
      setShowLecturerEnrollment(false);
    }
  };

  if (loading) return <SplashScreen />;
  if (!user) return <Auth onLogin={handleLogin} />;

  if (user.role === "lecturer") {
    if (showLecturerEnrollment) {
      return (
        <LecturerCourseEnrollment
          user={user}
          onDone={() => setShowLecturerEnrollment(false)}
        />
      );
    }
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

  if (user.role !== "student") {
    return <UnknownRole onLogout={handleLogout} />;
  }

  if (showEnrollment) {
    return <CourseEnrollment user={user} onDone={() => setShowEnrollment(false)} />;
  }

  if (!onboarded) {
    return (
      <BrowserRouter>
        <Onboarding onDone={() => { localStorage.setItem("unilearn-onboarded", "true"); setOnboarded(true); }} />
      </BrowserRouter>
    );
  }

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

// Unreachable in normal usage but prevents undefined render for unknown roles
function UnknownRole({ onLogout }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter,sans-serif",
        background: "#F5F5F7",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
        Unknown Account Role
      </div>
      <div style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 24 }}>
        Your account has an unrecognised role. Please contact support.
      </div>
      <button
        onClick={onLogout}
        style={{
          background: "#1B4332",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "14px 28px",
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "Inter,sans-serif",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
