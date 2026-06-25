import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import Ic from "../../components/Ic.jsx";
import Spinner from "../../components/Spinner.jsx";
import DirectMessage from "../../components/DirectMessage.jsx";

export default function MessagesInbox({ user, C }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: enr } = await supabase
      .from("enrollments")
      .select("course_id, courses(*)")
      .eq("student_id", user.id);

    const courses = (enr || []).map(e => e.courses).filter(Boolean);
    if (courses.length === 0) { setLoading(false); return; }

    const ids = courses.map(c => c.id);
    const { data: lcs } = await supabase
      .from("lecturer_courses")
      .select("course_id, lecturer_id")
      .in("course_id", ids);

    const uids = [...new Set((lcs || []).map(l => l.lecturer_id))];
    let profMap = {};
    if (uids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", uids);
      (profs || []).forEach(p => { profMap[p.id] = p; });
    }

    const convs = [];
    for (const c of courses) {
      const lc = (lcs || []).find(l => l.course_id === c.id);
      if (!lc) continue;
      const lecturer = profMap[lc.lecturer_id];
      if (!lecturer) continue;

      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("id, body, created_at, sender_id, read_at")
        .eq("course_id", c.id)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${lecturer.id}),and(sender_id.eq.${lecturer.id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: false })
        .limit(1);

      const last = msgs?.[0] || null;
      const unread = last && last.sender_id !== user.id && !last.read_at ? 1 : 0;

      convs.push({
        course: c,
        lecturerId: lecturer.id,
        lecturerName: lecturer.name || "Lecturer",
        lecturerAvatar: lecturer.avatar_url || null,
        lastBody: last?.body || null,
        lastTime: last?.created_at || null,
        unread,
      });
    }

    convs.sort((a, b) => {
      if (!a.lastTime && !b.lastTime) return 0;
      if (!a.lastTime) return 1;
      if (!b.lastTime) return -1;
      return new Date(b.lastTime) - new Date(a.lastTime);
    });

    setConversations(convs);
    setLoading(false);
  };

  const fmtTime = (t) => {
    if (!t) return "";
    const d = new Date(t);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  };

  if (selected) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => { setSelected(null); load(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <Ic n="chevronL" s={22} c={C.primary} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.primary + "20", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {selected.lecturerAvatar
              ? <img src={selected.lecturerAvatar} alt="lec" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Ic n="user" s={17} c={C.primary} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{selected.lecturerName}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{selected.course.code}</div>
          </div>
        </div>
        <DirectMessage
          course={selected.course}
          user={user}
          C={C}
          otherUserId={selected.lecturerId}
          otherUserName={selected.lecturerName}
        />
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text, letterSpacing: -0.5 }}>Messages</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Direct conversations with your lecturers</div>

      {conversations.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>No conversations yet</div>
          <div style={{ color: C.muted, fontSize: 14 }}>Open any course and tap "Message" to start chatting with your lecturer.</div>
        </div>
      )}

      {conversations.map(conv => (
        <div
          key={conv.course.id}
          onClick={() => setSelected(conv)}
          style={{
            background: C.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 10,
            border: `1px solid ${conv.unread > 0 ? C.primary + "55" : C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.primary + "20", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
            {conv.lecturerAvatar
              ? <img src={conv.lecturerAvatar} alt="lec" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Ic n="user" s={22} c={C.primary} />}
            {conv.unread > 0 && (
              <div style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, background: "#EF4444", borderRadius: "50%", border: `2px solid ${C.card}` }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{conv.lecturerName}</div>
              {conv.lastTime && (
                <div style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 8 }}>{fmtTime(conv.lastTime)}</div>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginBottom: 2 }}>{conv.course.code}</div>
            <div style={{
              fontSize: 13,
              color: conv.unread > 0 ? C.text : C.muted,
              fontWeight: conv.unread > 0 ? 700 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {conv.lastBody || "No messages yet — tap to start"}
            </div>
          </div>
          <Ic n="chevronR" s={16} c={C.muted} />
        </div>
      ))}
    </div>
  );
}
