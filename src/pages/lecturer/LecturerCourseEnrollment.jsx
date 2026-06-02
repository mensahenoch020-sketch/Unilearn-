import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import Ic from "../../components/Ic.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function LecturerCourseEnrollment({ user, onDone, initialSelected = [] }) {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(initialSelected);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      // Filter by lecturer's faculty and department if available
      let query = supabase.from("courses").select("*");
      if (user.faculty) query = query.eq("faculty", user.faculty);
      if (user.department) query = query.eq("department", user.department);
      const { data } = await query.order("code");
      if (!data || data.length === 0) {
        const { data: all } = await supabase.from("courses").select("*").order("code");
        setCourses(all || []);
      } else {
        setCourses(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    const rows = selected.map((courseId) => ({ lecturer_id: user.id, course_id: courseId }));
    await supabase.from("lecturer_courses").upsert(rows, { onConflict: "lecturer_id,course_id" });
    setSaving(false);
    onDone();
  };

  const filtered = courses.filter(
    (c) =>
      !search ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7", fontFamily: "Inter,sans-serif" }}>
      {/* Header */}
      <div
        style={{
          background: "#1B4332",
          color: "#fff",
          padding: "24px 20px 16px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Select Your Courses</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          Choose the courses you teach this semester
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: "10px 14px",
            marginTop: 14,
          }}
        >
          <Ic n="search" s={16} c="rgba(255,255,255,0.7)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: 14,
              color: "#fff",
              outline: "none",
              fontFamily: "Inter,sans-serif",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ padding: "16px 20px", paddingBottom: 120 }}>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12, fontWeight: 600 }}>
              {selected.length} course{selected.length !== 1 ? "s" : ""} selected
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", color: "#888", padding: "40px 0" }}>No courses found</div>
            )}
            {filtered.map((c) => {
              const isSelected = selected.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 10,
                    border: `2px solid ${isSelected ? "#1B4332" : "#F0F0F0"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 12px rgba(27,67,50,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: (c.color || "#1B4332") + "15",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Ic n="book" s={20} c={c.color || "#1B4332"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1A1A1A" }}>{c.code}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                      {c.level} Level · {c.semester}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#1B4332" : "#E0E0E0"}`,
                      background: isSelected ? "#1B4332" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom action */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          padding: "16px 20px",
          background: "#fff",
          borderTop: "1px solid #F0F0F0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <button
          onClick={save}
          disabled={selected.length === 0 || saving}
          style={{
            background: selected.length > 0 ? "#1B4332" : "#E8E8E8",
            color: selected.length > 0 ? "#fff" : "#999",
            border: "none",
            borderRadius: 14,
            padding: "16px 0",
            width: "100%",
            fontSize: 15,
            fontWeight: 700,
            cursor: selected.length > 0 ? "pointer" : "default",
            fontFamily: "Inter,sans-serif",
            transition: "background 0.2s",
          }}
        >
          {saving ? "Saving..." : `Continue with ${selected.length} course${selected.length !== 1 ? "s" : ""}`}
        </button>
        <button
          onClick={onDone}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 13,
            cursor: "pointer",
            width: "100%",
            marginTop: 10,
            fontFamily: "Inter,sans-serif",
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
