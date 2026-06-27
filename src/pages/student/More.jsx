import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Ic from "../../components/Ic.jsx";

export default function More({ user, dark, setDark, onLogout, C }) {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true); return;
    }
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()));
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSTip(true); return; }
    if (!installPrompt) { setShowIOSTip(true); return; }
    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") { setInstallPrompt(null); setIsInstalled(true); }
    } catch {
      setShowIOSTip(true);
    }
  };

  const items = [
    { label: "Notifications", icon: "bell", path: "/notifications", desc: "Messages, announcements & deadlines", color: "#F472B6" },
    { label: "Messages", icon: "msg", path: "/messages-inbox", desc: "Direct chats with your lecturers", color: "#A78BFA" },
    { label: "Timetable", icon: "calendar", path: "/timetable", desc: "Weekly class schedule", color: null },
    { label: "Attendance", icon: "users", path: "/attendance", desc: "Track your attendance", color: null },
    { label: "Grades", icon: "chart", path: "/grades", desc: "Academic performance & CGPA", color: null },
    { label: "App Guide", icon: "book", path: "/app-guide", desc: "How to use UniLearn", color: "#34D399" },
    { label: "Settings", icon: "settings", path: "/settings", desc: "Profile, password & preferences", color: null },
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
          <div style={{ fontSize: 12, color: C.muted }}>{user?.department || ""}{user?.department && user?.level ? " · " : ""}{user?.level || ""}</div>
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
              background: (it.color || C.primary) + "18",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ic n={it.icon} s={20} c={it.color || C.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{it.label}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{it.desc}</div>
          </div>
          <Ic n="chevronR" s={18} c={C.muted} />
        </div>
      ))}

      {/* Install App */}
      {!isInstalled && (
        <div onClick={handleInstall} style={{ background:"linear-gradient(135deg,#1B4332,#2D6A4F)", borderRadius:16, padding:16, marginBottom:10, display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
          <div style={{ width:44, height:44, background:"rgba(255,255,255,0.15)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic n="download" s={20} c="#fff" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#fff" }}>Install UniLearn App</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:2 }}>Add to home screen — works offline</div>
          </div>
          <Ic n="chevronR" s={18} c="rgba(255,255,255,0.6)" />
        </div>
      )}
      {isInstalled && (
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, background:"#D1FAE5", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic n="check" s={20} c="#10B981" w={2.5} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>App Installed</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>UniLearn is on your home screen</div>
          </div>
        </div>
      )}

      {/* iOS install tip modal */}
      {showIOSTip && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:9999, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={() => setShowIOSTip(false)}>
          <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:"28px 24px 40px", width:"100%", maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight:800, fontSize:18, color:"#1B4332", marginBottom:8 }}>Install UniLearn</div>
            <div style={{ fontSize:14, color:"#4B5563", lineHeight:1.7, marginBottom:20 }}>
              {isIOS ? (
                <>
                  <div style={{ marginBottom:10 }}>To install on your iPhone or iPad:</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}><div style={{ width:28, height:28, background:"#EFF6FF", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>1</div><span>Tap the <strong>Share</strong> button (↑) at the bottom of Safari</span></div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}><div style={{ width:28, height:28, background:"#EFF6FF", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>2</div><span>Scroll down and tap <strong>"Add to Home Screen"</strong></span></div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}><div style={{ width:28, height:28, background:"#EFF6FF", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>3</div><span>Tap <strong>Add</strong> — done!</span></div>
                </>
              ) : (
                <>Open this page in Chrome and look for the install icon in the address bar, or use your browser menu → "Add to Home Screen".</>
              )}
            </div>
            <button onClick={() => setShowIOSTip(false)} style={{ background:"#1B4332", color:"#fff", border:"none", borderRadius:12, padding:"14px 0", width:"100%", fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>Got it</button>
          </div>
        </div>
      )}

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
