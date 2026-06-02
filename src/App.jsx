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
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("unilearn-dark") === "true");
  const [loading, setLoading] = useState(true);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showLecturerEnrollment, setShowLecturerEnrollment] = useState(false);

  const C = dark ? DARK : LIGHT;

  useEffect(() => {
    localStorage.setItem("unilearn-dark", dark);
  }, [dark]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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

  if (showEnrollment) {
    return <CourseEnrollment user={user} onDone={() => setShowEnrollment(false)} />;
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
