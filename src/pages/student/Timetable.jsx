import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Timetable({ user, C }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = DAY_NAMES[new Date().getDay()];

  useEffect(() => {
    const load = async () => {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id);
      const ids = (enr || []).map((e) => e.course_id);
      if (ids.length > 0) {
        const { data } = await supabase
          .from("timetable")
          .select("*, courses(code, title, color)")
          .in("course_id", ids)
          .order("start_time");
        setSlots(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text, letterSpacing: -0.5 }}>
        Timetable
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
        2024/2025 · {user?.semester || ""} Semester
      </div>

      {slots.length === 0 && (
        <div style={{ textAlign: "center", color: C.muted, padding: "60px 0", fontSize: 14 }}>
          No timetable entries found. Enroll in courses first.
        </div>
      )}

      {DAYS.map((day) => {
        const daySlots = slots.filter((s) => s.day === day);
        const isToday = day === today;
        if (slots.length === 0 && daySlots.length === 0) return null;

        return (
          <div key={day} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: isToday ? C.primary : C.text }}>
                {day}
              </div>
              {isToday && <Badge text="Today" bg={C.primary} color="#fff" />}
            </div>

            {daySlots.length === 0 ? (
              <div
                style={{
                  background: C.card,
                  borderRadius: 12,
                  padding: "14px 16px",
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                No classes
              </div>
            ) : (
              daySlots.map((slot, i) => (
                <div
                  key={i}
                  style={{
                    background: C.card,
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 10,
                    border: `1px solid ${isToday ? C.primary + "40" : C.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{slot.start_time}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{slot.end_time}</div>
                  </div>
                  <div
                    style={{
                      width: 3,
                      height: 40,
                      background: slot.courses?.color || C.primary,
                      borderRadius: 3,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                      {slot.courses?.code}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {slot.courses?.title}
                    </div>
                    {slot.venue && (
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        📍 {slot.venue}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
