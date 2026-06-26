import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase.js";
import Ic from "../../components/Ic.jsx";

export default function AttendScan({ user, C }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const mark = async () => {
      // 1. Fetch session
      const { data: session, error: se } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!session || se) {
        setStatus("error"); setDetail("Invalid or expired QR code."); return;
      }

      // 2. Check 30-minute expiry
      if (Date.now() - new Date(session.created_at) > 30 * 60 * 1000) {
        setStatus("error"); setDetail("This QR code has expired. Ask your lecturer to generate a new one."); return;
      }

      // 3. Check enrollment
      const { data: enr } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", session.course_id)
        .single();

      if (!enr) {
        setStatus("error"); setDetail("You are not enrolled in this course."); return;
      }

      // 4. Check not already scanned
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("session_id", sessionId)
        .eq("student_id", user.id)
        .single();

      if (existing) {
        setStatus("already"); setDetail("Your attendance was already recorded for this class."); return;
      }

      // 5. Mark present
      const { error: ie } = await supabase.from("attendance_records").insert({
        session_id: sessionId,
        student_id: user.id,
        course_id: session.course_id,
        present: true,
      });

      if (ie) {
        setStatus("error"); setDetail("Failed to record attendance. Try again."); return;
      }

      setStatus("success");
    };

    mark();
  }, [sessionId, user.id]);

  const bg = C?.bg || "#F5F5F7";
  const text = C?.text || "#1A1A1A";
  const muted = C?.muted || "#6B6B6B";

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "Inter,sans-serif", textAlign: "center" }}>
      {status === "loading" && (
        <>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ width: 48, height: 48, border: "4px solid #1B433220", borderTop: "4px solid #1B4332", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 20 }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: text }}>Marking your attendance…</div>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Ic n="check" s={36} c="#10B981" w={3} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: text, marginBottom: 8 }}>Attendance Recorded!</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 32 }}>You're marked as present for today's class.</div>
          <button onClick={() => navigate("/")} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
            Go to App
          </button>
        </>
      )}

      {status === "already" && (
        <>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Ic n="bell" s={36} c="#3B82F6" />
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: text, marginBottom: 8 }}>Already Recorded</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 32 }}>{detail}</div>
          <button onClick={() => navigate("/")} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
            Go to App
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Ic n="x" s={36} c="#EF4444" w={3} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: text, marginBottom: 8 }}>Unable to Record</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 32 }}>{detail}</div>
          <button onClick={() => navigate("/")} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
            Go to App
          </button>
        </>
      )}
    </div>
  );
}
