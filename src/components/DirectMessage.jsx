import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { playNotif } from "../utils/sound.js";
import Ic from "./Ic.jsx";

export default function DirectMessage({ course, user, C, otherUserId, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!otherUserId) return;
    loadMessages();
    const channel = supabase
      .channel(`dm_${course.id}_${[user.id, otherUserId].sort().join("_")}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `course_id=eq.${course.id}`,
      }, (payload) => {
        // Play sound only for incoming messages from the other person
        if (payload.new?.sender_id === otherUserId) {
          playNotif();
        }
        loadMessages();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "direct_messages",
        filter: `course_id=eq.${course.id}`,
      }, () => loadMessages())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [otherUserId, course.id]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("direct_messages")
      .select("id, sender_id, body, created_at, read_at")
      .eq("course_id", course.id)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at");
    setMessages(data || []);
    prevCountRef.current = (data || []).length;
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    // Mark unread incoming messages as read
    const unread = (data || []).filter(m => m.sender_id !== user.id && !m.read_at);
    if (unread.length > 0) {
      supabase.from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread.map(m => m.id))
        .then(() => {});
    }
  };

  const send = async () => {
    if (!text.trim() || !otherUserId || sending) return;
    setSending(true);
    await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      course_id: course.id,
      body: text.trim(),
    });
    setText("");
    setSending(false);
  };

  if (!otherUserId) return (
    <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>
      No lecturer assigned to this course yet.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 300 }}>
      <div style={{ background: C.card, borderRadius: 12, padding: "12px 16px", marginBottom: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Private · {otherUserName}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{course.code} · Messages visible only to you and {otherUserName}</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: C.muted, padding: "40px 0", fontSize: 13 }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map(m => {
          const mine = m.sender_id === user.id;
          const isRead = !!m.read_at;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "76%",
                background: mine ? C.primary : C.card,
                color: mine ? "#fff" : C.text,
                borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "10px 14px",
                border: mine ? "none" : `1px solid ${C.border}`,
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {m.body}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
                  <span>{new Date(m.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</span>
                  {mine && (
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      {isRead ? (
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                          <path d="M1 5L4.5 8.5L10 2" stroke="#60C0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 5L8.5 8.5L14 2" stroke="#60C0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1 5L4 8L9 2" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={`Message ${otherUserName}...`}
          style={{
            flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 12,
            padding: "12px 16px", fontSize: 14, background: C.inputBg, color: C.text,
            outline: "none", fontFamily: "Inter,sans-serif",
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          style={{
            background: text.trim() ? C.primary : C.border,
            border: "none", borderRadius: 12, padding: "12px 16px",
            cursor: text.trim() ? "pointer" : "default", transition: "background 0.2s",
          }}
        >
          <Ic n="send" s={18} c="#fff" />
        </button>
      </div>
    </div>
  );
}
