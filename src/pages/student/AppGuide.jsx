import Ic from "../../components/Ic.jsx";

const SECTIONS = [
  {
    icon: "book",
    color: "#F4A261",
    bg: "#F4A26122",
    title: "Courses",
    body: "Access all your enrolled courses in one place. View lecture materials, submit assignments before deadlines, and take timed online quizzes. Add or remove courses at any time from the My Courses screen.",
  },
  {
    icon: "chart",
    color: "#60A5FA",
    bg: "#60A5FA22",
    title: "Grades & CGPA",
    body: "Your CGPA updates automatically as lecturers enter scores. See your full breakdown: CA1, CA2, Midterm, and Exam marks for every course. Download your grade report as a PDF anytime.",
  },
  {
    icon: "calendar",
    color: "#34D399",
    bg: "#34D39922",
    title: "Timetable",
    body: "Your weekly lecture schedule is always one tap away. See all classes for each day, with course code, time, and venue. Never miss a session.",
  },
  {
    icon: "bell",
    color: "#F472B6",
    bg: "#F472B622",
    title: "Announcements",
    body: "Lecturers post important announcements directly in each course. New announcements are highlighted with a badge. Check the Notifications tab to see everything across all your courses at once.",
  },
  {
    icon: "msg",
    color: "#A78BFA",
    bg: "#A78BFA22",
    title: "Direct Messaging",
    body: "Chat privately with your lecturer for any course — directly in the app. Open a course and tap 'Message', or use the Messages Inbox in the More tab to see all your conversations. Read receipts show when your message has been seen.",
  },
  {
    icon: "bell",
    color: "#FB923C",
    bg: "#FB923C22",
    title: "Notifications",
    body: "The Notifications page shows your unread messages, recent course announcements, and assignments due in the next 3 days — all in one feed. A badge on the More tab appears when you have unread items.",
  },
  {
    icon: "clip",
    color: "#FBBF24",
    bg: "#FBBF2422",
    title: "Assignments",
    body: "Each assignment shows the deadline, marks available, and your submission status. Upload your work as a PDF, Word document, or ZIP file. Graded assignments show your score and any lecturer feedback.",
  },
  {
    icon: "users",
    color: "#6EE7B7",
    bg: "#6EE7B722",
    title: "Attendance",
    body: "Track your attendance record for all courses. See your present/absent history and calculate your current attendance percentage to ensure you meet the minimum requirement.",
  },
  {
    icon: "settings",
    color: "#94A3B8",
    bg: "#94A3B822",
    title: "Settings & Profile",
    body: "Update your profile picture, change your password, and manage your account details. Toggle dark mode for a more comfortable reading experience at night.",
  },
];

export default function AppGuide({ C }) {
  const printGuide = () => {
    const style = document.createElement("style");
    style.id = "__print_guide";
    style.textContent = `
      @media print {
        body > div > div > div:first-child { display: none !important; }
        nav { display: none !important; }
        button { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.getElementById("__print_guide")?.remove(), 1500);
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text, letterSpacing: -0.5 }}>App Guide</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Everything you need to know about UniLearn</div>

      {SECTIONS.map(s => (
        <div
          key={s.title}
          style={{ background: C.card, borderRadius: 16, padding: 18, marginBottom: 12, border: `1px solid ${C.border}` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic n={s.icon} s={20} c={s.color} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{s.title}</div>
          </div>
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7, opacity: 0.85 }}>{s.body}</div>
        </div>
      ))}

      <button
        onClick={printGuide}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "16px 0",
          background: C.primary,
          color: "#fff",
          border: "none",
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "Inter,sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ic n="file" s={18} c="#fff" /> Download Guide (PDF)
      </button>

      <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 12 }}>
        UniLearn · University of Ilorin · 2024/2025
      </div>
    </div>
  );
}
