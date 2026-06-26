import { useState, useEffect } from "react";
import Ic from "./Ic.jsx";

// Renders a bottom banner prompting Android users to install, and shows
// instructions for iOS (no programmatic install API on Safari).
// Auto-shows once, dismisses for 7 days, never shows if already installed.
export default function PWAInstall({ C }) {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed in standalone mode — don't prompt
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) return;

    // Dismissed within the last 7 days
    const ts = localStorage.getItem("pwa-dismissed");
    if (ts && Date.now() - parseInt(ts) < 7 * 86400000) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    if (ios) {
      // Show iOS tip after 4 seconds (no install event on Safari)
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e) => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    setShow(false);
    if (outcome === "accepted") localStorage.setItem("pwa-dismissed", Date.now().toString());
  };

  const dismiss = () => {
    localStorage.setItem("pwa-dismissed", Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  const bg = "#1B4332";

  return (
    <div style={{
      position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 24px)", maxWidth: 448,
      background: bg, color: "#fff", borderRadius: 18,
      padding: "14px 16px", zIndex: 9990,
      boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
      display: "flex", alignItems: "flex-start", gap: 12,
      fontFamily: "Inter,sans-serif",
    }}>
      <div style={{
        width: 46, height: 46, background: "#F4A261", borderRadius: 13,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Ic n="book" s={22} c="#fff" w={2.2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>Install UniLearn</div>
        {isIOS ? (
          <>
            <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.55 }}>
              Tap the <strong>Share</strong> icon (↑) at the bottom of Safari, then tap{" "}
              <strong>"Add to Home Screen"</strong>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.55, marginBottom: 10 }}>
              Add to your home screen for instant access — works like a native app, no App Store needed.
            </div>
            <button onClick={install} style={{
              background: "#F4A261", color: "#fff", border: "none", borderRadius: 10,
              padding: "8px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer",
              fontFamily: "Inter,sans-serif",
            }}>
              Install Now
            </button>
          </>
        )}
      </div>

      <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.65, flexShrink: 0 }}>
        <Ic n="x" s={18} c="#fff" />
      </button>
    </div>
  );
}
