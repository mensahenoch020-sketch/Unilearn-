import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import Ic from "./Ic.jsx";
import Badge from "./Badge.jsx";
import Spinner from "./Spinner.jsx";

export default function CourseDiscussion({ course, user, C, onCall }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [replies, setReplies] = useState({});
  const [expanded, setExpanded] = useState({});
  const [replyPosts, setReplyPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [liveCall, setLiveCall] = useState(null);
  const [startingCall, setStartingCall] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    loadPosts();

    // Realtime: new forum posts
    const forumChannel = supabase
      .channel(`forum-${course.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_posts", filter: `course_id=eq.${course.id}` }, () => loadPosts())
      .subscribe();

    // Check for an already-active call on mount
    supabase
      .from("course_calls")
      .select("*")
      .eq("course_id", course.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .then(({ data }) => { if (data?.[0]) setLiveCall(data[0]); });

    // Realtime: live call start/end for this course
    const callChannel = supabase
      .channel(`course-calls-${course.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "course_calls", filter: `course_id=eq.${course.id}` },
        (payload) => setLiveCall(payload.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "course_calls", filter: `course_id=eq.${course.id}` },
        (payload) => { if (payload.new.ended_at) setLiveCall(null); })
      .subscribe();

    return () => {
      supabase.removeChannel(forumChannel);
      supabase.removeChannel(callChannel);
    };
  }, [course.id]);

  const loadPosts = async () => {
    try {
      const { data } = await supabase
        .from("forum_posts")
        .select("*, profiles(name, role)")
        .eq("course_id", course.id)
        .is("parent_id", null)
        .order("created_at", { ascending: false });
      setPosts(data || []);
    } catch {
      // network error — show empty state
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (postId) => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*, profiles(name, role)")
      .eq("parent_id", postId)
      .order("created_at", { ascending: true });
    setReplyPosts((prev) => ({ ...prev, [postId]: data || [] }));
  };

  const startCall = async (type) => {
    if (!onCall || startingCall) return;
    setStartingCall(true);
    try {
      const res = await fetch("/api/call/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callType: type }),
      });
      if (!res.ok) return;
      const { url, name } = await res.json();
      if (!url) return;

      // Save to DB so students can see and join
      const { data: record } = await supabase
        .from("course_calls")
        .insert({ course_id: course.id, room_url: url, room_name: name, call_type: type, started_by: user.id })
        .select()
        .single();

      onCall({ type, url, callId: record?.id || null });
    } catch {
      // silently fail — user still sees error from CallScreen if needed
    } finally {
      setStartingCall(false);
    }
  };

  const postMessage = async () => {
    if (!newPost.trim()) return;
    setPostError("");
    const { error } = await supabase.from("forum_posts").insert({
      course_id: course.id,
      author_id: user.id,
      content: newPost.trim(),
      parent_id: null,
    });
    if (error) { setPostError("Failed to post. Please try again."); return; }
    setNewPost("");
    loadPosts();
  };

  const postReply = async (parentId) => {
    const text = replies[parentId];
    if (!text?.trim()) return;
    setPostError("");
    const { error } = await supabase.from("forum_posts").insert({
      course_id: course.id,
      author_id: user.id,
      content: text.trim(),
      parent_id: parentId,
    });
    if (error) { setPostError("Failed to post reply. Please try again."); return; }
    setReplies({ ...replies, [parentId]: "" });
    loadReplies(parentId);
  };

  const toggleExpand = async (postId) => {
    const next = !expanded[postId];
    setExpanded({ ...expanded, [postId]: next });
    if (next) loadReplies(postId);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: C.text }}>Discussion</div>
        {/* Any user can start a call — it saves to course_calls so others see the banner */}
        {onCall && (
          <>
            <button
              onClick={() => startCall("video")}
              disabled={startingCall}
              style={{ background: "#1B433218", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: startingCall ? 0.5 : 1 }}
            >
              <Ic n="video" s={16} c="#1B4332" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1B4332" }}>Video</span>
            </button>
            <button
              onClick={() => startCall("voice")}
              disabled={startingCall}
              style={{ background: "#F4A26118", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: startingCall ? 0.5 : 1 }}
            >
              <Ic n="phone" s={16} c="#F4A261" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#F4A261" }}>Voice</span>
            </button>
          </>
        )}
      </div>

      {/* Live call banner — visible to everyone when a call is active */}
      {liveCall && onCall && (
        <div
          onClick={() => onCall({ type: liveCall.call_type, url: liveCall.room_url, callId: null })}
          style={{
            background: "linear-gradient(135deg, #064E3B, #065F46)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(6,78,59,0.3)",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34D399", flexShrink: 0, boxShadow: "0 0 0 3px rgba(52,211,153,0.3)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
              Live {liveCall.call_type === "video" ? "Video" : "Voice"} Class in Progress
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>Tap to join now</div>
          </div>
          <Ic n={liveCall.call_type === "video" ? "video" : "phone"} s={20} c="#34D399" />
        </div>
      )}

      {/* New post box */}
      <div
        style={{
          background: C.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          border: `1px solid ${C.border}`,
        }}
      >
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Ask a question or start a discussion..."
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            fontSize: 14,
            color: C.text,
            outline: "none",
            resize: "none",
            minHeight: 70,
            fontFamily: "Inter,sans-serif",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={postMessage}
            disabled={!newPost.trim()}
            style={{
              background: newPost.trim() ? "#1B4332" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 18px",
              cursor: newPost.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <Ic n="send" s={14} c="#fff" /> Post
          </button>
        </div>
        {postError && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#EF4444" }}>{postError}</div>
        )}
      </div>

      {/* Posts list */}
      {loading ? (
        <Spinner fullPage={false} />
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>
          No posts yet. Start the discussion!
        </div>
      ) : (
        posts.map((p) => (
          <div
            key={p.id}
            style={{
              background: C.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: p.profiles?.role === "lecturer" ? "#1B433220" : "#3B82F620",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Ic n="user" s={16} c={p.profiles?.role === "lecturer" ? "#1B4332" : "#3B82F6"} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.profiles?.name}</span>
                  <Badge
                    text={p.profiles?.role}
                    bg={p.profiles?.role === "lecturer" ? "#1B433220" : "#3B82F620"}
                    color={p.profiles?.role === "lecturer" ? "#1B4332" : "#3B82F6"}
                  />
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{formatTime(p.created_at)}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 6, color: C.text }}>{p.content}</div>
                <button
                  onClick={() => toggleExpand(p.id)}
                  style={{ background: "none", border: "none", color: C.info, fontSize: 12, cursor: "pointer", marginTop: 6, padding: 0 }}
                >
                  {expanded[p.id] ? "Hide replies" : "Reply / View replies"}
                </button>
              </div>
            </div>

            {/* Replies */}
            {expanded[p.id] && (
              <div style={{ paddingLeft: 46 }}>
                {(replyPosts[p.id] || []).map((r) => (
                  <div
                    key={r.id}
                    style={{ marginBottom: 10, paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}
                  >
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{r.profiles?.name}</span>
                      <Badge
                        text={r.profiles?.role}
                        bg={r.profiles?.role === "lecturer" ? "#1B433220" : "#3B82F620"}
                        color={r.profiles?.role === "lecturer" ? "#1B4332" : "#3B82F6"}
                      />
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: C.text }}>{r.content}</div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input
                    value={replies[p.id] || ""}
                    onChange={(e) => setReplies({ ...replies, [p.id]: e.target.value })}
                    placeholder="Write a reply..."
                    style={{
                      flex: 1,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: C.text,
                      background: C.inputBg,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => postReply(p.id)}
                    style={{
                      background: C.primary,
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <Ic n="send" s={14} c="#fff" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
