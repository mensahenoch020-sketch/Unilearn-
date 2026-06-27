import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import Ic from "../../components/Ic.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function Notifications({ user, C }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [user.id]);

  const load = async () => {
    try {
    const all = [];

    // Unread DMs
    const { data: dms } = await supabase
      .from("direct_messages")
      .select("id, body, created_at, sender_id, course_id")
      .eq("receiver_id", user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false });

    const senderIds = [...new Set((dms || []).map(d => d.sender_id))];
    let senderMap = {};
    if (senderIds.length > 0) {
      const { data: senders } = await supabase.from("profiles").select("id, name").in("id", senderIds);
      (senders || []).forEach(s => { senderMap[s.id] = s.name; });
    }

    (dms || []).forEach(dm => {
      all.push({
        type: "message",
        id: String(dm.id),
        title: `New message from ${senderMap[dm.sender_id] || "Lecturer"}`,
        desc: dm.body,
        time: dm.created_at,
      });
    });

    // Enrolled course IDs
    const { data: enr } = await supabase
      .from("enrollments")
      .select("course_id, courses(id, code)")
      .eq("student_id", user.id);

    const courseMap = {};
    (enr || []).forEach(e => { if (e.courses) courseMap[e.courses.id] = e.courses.code; });
    const ids = Object.keys(courseMap).map(Number);

    if (ids.length > 0) {
      // Announcements from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: ann } = await supabase
        .from("announcements")
        .select("id, title, body, created_at, course_id")
        .in("course_id", ids)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });

      (ann || []).forEach(a => {
        all.push({
          type: "announcement",
          id: `ann-${a.id}`,
          title: a.title,
          desc: `${courseMap[a.course_id] || "Course"} · ${a.body.slice(0, 80)}${a.body.length > 80 ? "…" : ""}`,
          time: a.created_at,
        });
      });

      // Assignments due in next 3 days
      const now = new Date().toISOString();
      const threeDays = new Date(Date.now() + 3 * 86400000).toISOString();
      const { data: asgn } = await supabase
        .from("assignments")
        .select("id, title, due_date, course_id")
        .in("course_id", ids)
        .gte("due_date", now)
        .lte("due_date", threeDays)
        .order("due_date");

      (asgn || []).forEach(a => {
        const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
        const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
        all.push({
          type: "deadline",
          id: `asgn-${a.id}`,
          title: `${courseMap[a.course_id] || "Course"}: ${a.title}`,
          desc: `Due ${when} · ${new Date(a.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`,
          time: a.due_date,
        });
      });
    }

    all.sort((a, b) => new Date(b.time) - new Date(a.time));
    setItems(all);
    } catch {
      // network error — show empty state
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (t) => {
    const mins = Math.floor((Date.now() - new Date(t)) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const iconFor = (type) => {
    if (type === "message") return { n: "msg", bg: "#A78BFA22", c: "#A78BFA" };
    if (type === "announcement") return { n: "bell", bg: "#F472B622", c: "#F472B6" };
    return { n: "calendar", bg: "#FB923C22", c: "#FB923C" };
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text, letterSpacing: -0.5 }}>Notifications</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Messages, announcements & deadlines</div>

      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔔</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>All caught up!</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No new messages, announcements, or upcoming deadlines.</div>
        </div>
      )}

      {items.map(item => {
        const ic = iconFor(item.type);
        return (
          <div
            key={item.id}
            style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 12 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic n={ic.n} s={20} c={ic.c} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{timeAgo(item.time)}</div>
            </div>
          </div>
        );
      })}

      <button
        onClick={load}
        style={{ width: "100%", marginTop: 8, padding: "12px 0", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, fontSize: 13, fontWeight: 700, color: C.muted, cursor: "pointer" }}
      >
        Refresh
      </button>
    </div>
  );
}
