import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Ic from "../../components/Ic.jsx";

const SLIDES = [
  {
    emoji: "🎓",
    gradient: "linear-gradient(160deg, #1B4332 0%, #2D6A4F 100%)",
    accent: "#F4A261",
    title: "Welcome to UniLearn",
    desc: "Your complete university learning companion. Everything you need for academic success — courses, grades, schedules, and communication — all in one place.",
  },
  {
    emoji: "📚",
    gradient: "linear-gradient(160deg, #1E3A8A 0%, #3B82F6 100%)",
    accent: "#93C5FD",
    title: "Courses & Assignments",
    desc: "Access lecture materials, download course resources, submit assignments before deadlines, and take timed online quizzes. Add or remove courses at any time.",
  },
  {
    emoji: "📊",
    gradient: "linear-gradient(160deg, #4C1D95 0%, #7C3AED 100%)",
    accent: "#C4B5FD",
    title: "Grades & Timetable",
    desc: "Watch your CGPA update in real time as scores come in. See your full score breakdown and never miss a class with your weekly lecture timetable.",
  },
  {
    emoji: "💬",
    gradient: "linear-gradient(160deg, #92400E 0%, #F59E0B 100%)",
    accent: "#FDE68A",
    title: "Chat & Notifications",
    desc: "Message your lecturers directly in the app. Get instant course announcements and deadline reminders — so nothing slips through the cracks.",
  },
];

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: current.gradient,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter,sans-serif",
        transition: "background 0.5s ease",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Skip */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px 0" }}>
        <button
          onClick={() => onDone?.()}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "8px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Skip
        </button>
      </div>

      {/* Emoji illustration */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          key={slide}
          style={{
            fontSize: 120,
            animation: "slideUp 0.5s ease",
            filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))",
          }}
        >
          {current.emoji}
        </div>
      </div>

      {/* Content card */}
      <div
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          borderRadius: "28px 28px 0 0",
          padding: "32px 28px 48px",
        }}
      >
        {/* Dots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === slide ? "#fff" : "rgba(255,255,255,0.35)",
                transition: "all 0.3s",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        <div
          key={`title-${slide}`}
          style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 16, letterSpacing: -0.5, animation: "slideUp 0.4s ease" }}
        >
          {current.title}
        </div>
        <div
          key={`desc-${slide}`}
          style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 32, animation: "slideUp 0.45s ease" }}
        >
          {current.desc}
        </div>

        {isLast ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => onDone?.()}
              style={{
                background: "#fff",
                color: "#1B4332",
                border: "none",
                borderRadius: 16,
                padding: "18px 0",
                width: "100%",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "Inter,sans-serif",
              }}
            >
              Get Started 🚀
            </button>
            <button
              onClick={() => { onDone?.(); setTimeout(() => navigate("/app-guide"), 100); }}
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 16,
                padding: "16px 0",
                width: "100%",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Inter,sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ic n="file" s={16} c="#fff" /> Download App Guide
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSlide(s => s + 1)}
            style={{
              background: "#fff",
              color: "#1B4332",
              border: "none",
              borderRadius: 16,
              padding: "18px 0",
              width: "100%",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "Inter,sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Next <Ic n="chevronR" s={18} c="#1B4332" />
          </button>
        )}
      </div>
    </div>
  );
}
