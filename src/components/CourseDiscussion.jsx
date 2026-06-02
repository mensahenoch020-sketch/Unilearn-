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

  // Load posts on mount
  useEffect(() => {
    loadPosts();

    // ✅ REAL-TIME: subscribe to new posts in this course
    const channel = supabase
      .channel(`forum-${course.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_posts",
          filter: `course_id=eq.${course.id}`,
        },
        () => {
          // Reload posts when a new one is inserted by anyone
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [course.id]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*, profiles(name, role)")
      .eq("course_id", course.id)
      .is("parent_id", null)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const loadReplies = async (postId) => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*, profiles(name, role)")
      .eq("parent_id", postId)
      .order("created_at", { ascending: true });
    setReplyPosts((prev) => ({ ...prev, [postId]: data || [] }));
  };

  const postMessage = async () => {
    if (!newPost.trim()) return;
    await supabase.from("forum_posts").insert({
      course_id: course.id,
      author_id: user.id,
      content: newPost.trim(),
      parent_id: null,
    });
    setNewPost("");
    // Real-time will reload, but also reload manually for instant feedback
    loadPosts();
  };

  const postReply = async (parentId) => {
    const text = replies[parentId];
    if (!text?.trim()) return;
    await supabase.from("forum_posts").insert({
      course_id: course.id,
      author_id: user.id,
      content: text.trim(),
      parent_id: parentId,
    });
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
      {/* Header with call buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: C.text }}>Discussion</div>
        <button
          onClick={() => onCall("video")}
          style={{
            background: "#1B433218",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ic n="video" s={16} c="#1B4332" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1B4332" }}>Video</span>
        </button>
        <button
          onClick={() => onCall("voice")}
          style={{
            background: "#F4A26118",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ic n="phone" s={16} c="#F4A261" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#F4A261" }}>Voice</span>
        </button>
      </div>

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
                {(replyPosts[p.id] || []).map((r, i) => (
                  <div
                    key={i}
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
