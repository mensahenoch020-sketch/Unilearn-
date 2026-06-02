import { useState, useEffect } from "react";
import Ic from "./Ic.jsx";

export default function CallScreen({ callType, onClose }) {
  const [status, setStatus] = useState("connecting");
  const [roomUrl, setRoomUrl] = useState(null);

  useEffect(() => {
    const createRoom = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/call/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callType }),
        });
        const data = await res.json();
        if (data.url) {
          setRoomUrl(data.url);
          setStatus("active");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    createRoom();
  }, [callType]);

  if (roomUrl) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 18px",
            background: "rgba(0,0,0,0.8)",
          }}
        >
          <div style={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {callType === "video" ? "Video Call" : "Voice Call"}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#EF4444",
              border: "none",
              borderRadius: 10,
              padding: "8px 18px",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            End Call
          </button>
        </div>
        <iframe
          src={roomUrl}
          style={{ flex: 1, border: "none" }}
          allow="camera; microphone; fullscreen; display-capture"
          title="Call Room"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0D1B2A",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        fontFamily: "Inter,sans-serif",
      }}
    >
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          {callType === "video" ? "Video Call" : "Voice Call"}
        </div>
        <div style={{ fontSize: 22, color: "#fff", fontWeight: 700 }}>
          {status === "connecting" ? "Connecting..." : "Failed to connect"}
        </div>
        {status === "error" && (
          <div style={{ fontSize: 14, color: "#EF4444", marginTop: 8 }}>Could not create call room.</div>
        )}
      </div>

      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "pulse 2s ease-in-out infinite",
        }}
      >
        <Ic n={callType === "video" ? "video" : "phone"} s={44} c="#fff" w={2} />
      </div>

      <button
        onClick={onClose}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#EF4444",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ic n="phoneOff" s={22} c="#fff" />
      </button>
    </div>
  );
}
