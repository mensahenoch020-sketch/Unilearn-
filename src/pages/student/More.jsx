import { useNavigate } from "react-router-dom";
import Ic from "../../components/Ic.jsx";

export default function More({ user, dark, setDark, onLogout, C }) {
  const navigate = useNavigate();

  const items = [
    { label: "Timetable", icon: "calendar", path: "/timetable", desc: "Weekly class schedule" },
    { label: "Attendance", icon: "users", path: "/attendance", desc: "Track your attendance" },
    { label: "Grades", icon: "chart", path: "/grades", desc: "Academic performance & CGPA" },
    { label: "Settings", icon: "settings", path: "/settings", desc: "Profile, password & preferences" },
  ];

  return (
    <div>
      {/* Profile summary */}
      <div
        style={{
          background: C.card,
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          border: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Ic n="user" s={26} c="#fff" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{user?.email}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{user?.department} · {user?.level}</div>
          {user?.matric && <div style={{ fontSize: 12, color: C.muted }}>Matric: {user?.matric}</div>}
        </div>
      </div>

      {/* Nav items */}
      {items.map((it) => (
        <div
          key={it.path}
          onClick={() => navigate(it.path)}
          style={{
            background: C.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 10,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: C.primary + "18",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ic n={it.icon} s={20} c={C.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{it.label}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{it.desc}</div>
          </div>
          <Ic n="chevronR" s={18} c={C.muted} />
        </div>
      ))}

      {/* Dark mode toggle */}
      <div
        style={{
          background: C.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          border: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ width: 44, height: 44, background: C.primary + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic n={dark ? "sun" : "moon"} s={20} c={C.primary} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{dark ? "Light Mode" : "Dark Mode"}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Switch appearance</div>
        </div>
        <div
          onClick={() => setDark(!dark)}
          style={{
            width: 50,
            height: 28,
            borderRadius: 14,
            background: dark ? C.primary : C.border,
            position: "relative",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              left: dark ? 26 : 4,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.3s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={onLogout}
        style={{
          background: "#FEE2E2",
          color: "#EF4444",
          border: "none",
          borderRadius: 14,
          padding: "16px 0",
          width: "100%",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "Inter,sans-serif",
        }}
      >
        <Ic n="logout" s={18} c="#EF4444" /> Sign Out
      </button>
    </div>
  );
}
