import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { playNotif } from "../utils/sound.js";
import Ic from "./Ic.jsx";

export default function DirectMessage({ course, user, C, otherUserId, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

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
        const msg = payload.new;
        // Only handle incoming messages — own messages are added optimistically on send
        if (msg?.sender_id !== user.id) {
          playNotif();
          setMessages(prev => {
            // Avoid duplicates (realtime can sometimes fire twice)
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
          // Mark as read immediately
          supabase.from("direct_messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", msg.id).then(() => {});
        }
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
    const body = text.trim();
    if (!body || !otherUserId || sending) return;
    setSending(true);
    setText(""); // Clear input immediately

    // Optimistic update — show message right away without waiting for DB
    const optimistic = {
      id: `opt_${Date.now()}`,
      sender_id: user.id,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);

    const { data: newMsg, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: user.id, receiver_id: otherUserId, course_id: course.id, body })
      .select("id, sender_id, body, created_at, read_at")
      .single();

    setSending(false);

    if (error) {
      // Revert optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(body);
      return;
    }

    // Replace optimistic message with real one from DB
    setMessages(prev => prev.map(m => m.id === optimistic.id ? newMsg : m));
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
          const isOptimistic = !!m._optimistic;
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
                opacity: isOptimistic ? 0.75 : 1,
                transition: "opacity 0.2s",
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
