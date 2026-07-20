import { useState, useEffect } from "react";
import { supabase } from "../../supabase.js";
import Ic from "../../components/Ic.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";

// Helper to format date nicely (Nigerian style)
const fmtDate = (d) => new Date(d).toLocaleDateString("en-NG", { 
  day: "numeric", month: "short", year: "numeric" 
});

export default function AdminApp({ user, setUser, dark, setDark, C, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  
  // Shared data
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalAdmins: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeUsers: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Users section
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Courses section
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [lecturers, setLecturers] = useState([]); // for assignment
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [selectedLecturers, setSelectedLecturers] = useState([]);

  // Enrollments section
  const [enrollments, setEnrollments] = useState([]);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollFilterCourse, setEnrollFilterCourse] = useState("all");

  // Tools section
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPriority, setAnnPriority] = useState("normal");
  const [toolMessage, setToolMessage] = useState("");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "chart" },
    { id: "users", label: "Users", icon: "users" },
    { id: "courses", label: "Courses", icon: "book" },
    { id: "enrollments", label: "Enrollments", icon: "clipboard" },
    { id: "tools", label: "System Tools", icon: "settings" },
  ];

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadCourses(),
        loadEnrollments(),
        loadLecturers(),
      ]);
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== STATS & DASHBOARD ====================
  const loadStats = async () => {
    try {
      const [
        { count: students },
        { count: lecturers },
        { count: admins },
        { count: courses },
        { count: enrolls },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "lecturer"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
      ]);

      // Active users = those with is_active true (or fallback to all if column missing)
      const { count: active } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        totalStudents: students || 0,
        totalLecturers: lecturers || 0,
        totalAdmins: admins || 0,
        totalCourses: courses || 0,
        totalEnrollments: enrolls || 0,
        activeUsers: active || (students || 0) + (lecturers || 0) + (admins || 0),
      });

      // Recent activity (last 8 profiles + recent enrollments)
      const { data: recentProfiles } = await supabase
        .from("profiles")
        .select("id, name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(recentProfiles || []);
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  // ==================== USERS ====================
  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setUsers(data || []);
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        !userSearch ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.matric?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });

  const openUser = (u) => {
    setSelectedUser(u);
    setShowUserModal(true);
  };

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (!error) {
      await loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      // If promoting to lecturer, you may want to handle lecturer_courses here
    } else {
      alert("Failed to update role: " + error.message);
    }
  };

  const toggleActive = async (userId, current) => {
    const newVal = !current;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: newVal })
      .eq("id", userId);
    if (!error) {
      await loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_active: newVal });
      }
    } else {
      alert("Failed to update status. Did you run the ALTER TABLE for is_active column?");
    }
  };

  // ==================== COURSES ====================
  const loadCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("code");
    if (!error) setCourses(data || []);
  };

  const loadLecturers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, department")
      .eq("role", "lecturer")
      .eq("is_active", true);
    setLecturers(data || []);
  };

  const filteredCourses = courses.filter((c) =>
    !courseSearch ||
    c.code?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.department?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const openCourseEditor = (course = null) => {
    setEditingCourse(course || {
      code: "", title: "", department: "", faculty: "", level: 100, semester: "First", units: 3, color: "#1B4332"
    });
    setShowCourseModal(true);
  };

  const saveCourse = async () => {
    if (!editingCourse.code || !editingCourse.title) {
      alert("Code and Title are required");
      return;
    }
    let error;
    if (editingCourse.id) {
      ({ error } = await supabase.from("courses").update(editingCourse).eq("id", editingCourse.id));
    } else {
      ({ error } = await supabase.from("courses").insert([editingCourse]));
    }
    if (!error) {
      setShowCourseModal(false);
      setEditingCourse(null);
      await loadCourses();
    } else {
      alert("Save failed: " + error.message);
    }
  };

  const deleteCourse = async (id) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (!error) await loadCourses();
  };

  // Assign lecturers to a course
  const openAssignModal = async (course) => {
    setAssigningCourse(course);
    // Load current assignments for this course
    const { data: current } = await supabase
      .from("lecturer_courses")
      .select("lecturer_id")
      .eq("course_id", course.id);
    const currentIds = (current || []).map((x) => x.lecturer_id);
    setSelectedLecturers(currentIds);
  };

  const saveLecturerAssignments = async () => {
    if (!assigningCourse) return;
    // Simple approach: delete all existing, insert new
    await supabase.from("lecturer_courses").delete().eq("course_id", assigningCourse.id);
    
    if (selectedLecturers.length > 0) {
      const inserts = selectedLecturers.map((lid) => ({
        lecturer_id: lid,
        course_id: assigningCourse.id,
      }));
      const { error } = await supabase.from("lecturer_courses").insert(inserts);
      if (error) alert("Assignment error: " + error.message);
    }
    setAssigningCourse(null);
    setSelectedLecturers([]);
    alert("Lecturer assignments updated!");
  };

  // ==================== ENROLLMENTS ====================
  const loadEnrollments = async () => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id, created_at,
        profiles:student_id (id, name, matric, email, department, level),
        courses:course_id (id, code, title, color)
      `)
      .order("created_at", { ascending: false });
    if (!error) setEnrollments(data || []);
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const s = e.profiles;
    const c = e.courses;
    const matchesSearch =
      !enrollSearch ||
      s?.name?.toLowerCase().includes(enrollSearch.toLowerCase()) ||
      s?.matric?.toLowerCase().includes(enrollSearch.toLowerCase()) ||
      c?.code?.toLowerCase().includes(enrollSearch.toLowerCase());
    const matchesCourse = enrollFilterCourse === "all" || c?.id === enrollFilterCourse;
    return matchesSearch && matchesCourse;
  });

  const exportEnrollmentsCSV = () => {
    const headers = ["Student Name", "Matric", "Email", "Department", "Level", "Course Code", "Course Title", "Enrolled Date"];
    const rows = filteredEnrollments.map((e) => [
      e.profiles?.name || "",
      e.profiles?.matric || "",
      e.profiles?.email || "",
      e.profiles?.department || "",
      e.profiles?.level || "",
      e.courses?.code || "",
      e.courses?.title || "",
      fmtDate(e.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unilearn_enrollments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==================== SYSTEM TOOLS ====================
  const postGlobalAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      alert("Title and body are required");
      return;
    }
    const { error } = await supabase.from("announcements").insert([{
      title: annTitle.trim(),
      body: annBody.trim(),
      priority: annPriority,
      author_id: user.id,
    }]);
    if (!error) {
      setToolMessage("✅ Global announcement posted successfully!");
      setAnnTitle("");
      setAnnBody("");
      setTimeout(() => setToolMessage(""), 3000);
    } else {
      setToolMessage("❌ Failed: " + error.message);
    }
  };

  const exportReport = async (type) => {
    setToolMessage("Generating report...");
    if (type === "enrollments") {
      exportEnrollmentsCSV();
    } else if (type === "users") {
      const { data } = await supabase.from("profiles").select("*");
      // simple CSV
      const csv = [
        ["Name", "Email", "Role", "Department", "Matric/StaffID", "Created"],
        ...(data || []).map((u) => [u.name, u.email, u.role, u.department, u.matric || u.staff_id, fmtDate(u.created_at)])
      ].map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "unilearn_users_report.csv";
      a.click();
    }
    setToolMessage("Report downloaded!");
    setTimeout(() => setToolMessage(""), 2500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Inter, sans-serif", color: C.text }}>
      {/* Top Header */}
      <div style={{
        background: C.headerBg || C.primary,
        color: C.headerText || "#fff",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "#F4A261", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="book" s={20} c="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>UniLearn Admin</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>University of Ilorin</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{user?.role?.toUpperCase()}</div>
          </div>
          <button
            onClick={() => setDark(!dark)}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={onLogout}
            style={{ background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        background: C.card, 
        borderBottom: `1px solid ${C.border}`,
        padding: "0 20px",
        display: "flex",
        gap: 4,
        overflowX: "auto"
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "14px 20px",
              border: "none",
              background: activeTab === tab.id ? C.primary : "transparent",
              color: activeTab === tab.id ? "#fff" : C.muted,
              fontWeight: activeTab === tab.id ? 700 : 500,
              borderRadius: "12px 12px 0 0",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap"
            }}
          >
            <Ic n={tab.icon} s={16} c={activeTab === tab.id ? "#fff" : C.muted} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
        {/* ========== DASHBOARD ========== */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Platform Overview</div>
              <div style={{ color: C.muted }}>Real-time statistics for UniLearn</div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Students", value: stats.totalStudents, icon: "users", color: C.info },
                { label: "Lecturers", value: stats.totalLecturers, icon: "user", color: C.success },
                { label: "Admins", value: stats.totalAdmins, icon: "shield", color: C.warning },
                { label: "Courses", value: stats.totalCourses, icon: "book", color: C.primary },
                { label: "Enrollments", value: stats.totalEnrollments, icon: "clipboard", color: "#8B5CF6" },
                { label: "Active Users", value: stats.activeUsers, icon: "activity", color: C.success },
              ].map((stat, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{stat.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </div>
                    <div style={{ width: 44, height: 44, background: stat.color + "15", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Ic n={stat.icon} s={22} c={stat.color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Activity</div>
              {recentActivity.length === 0 ? (
                <div style={{ color: C.muted, padding: "20px 0" }}>No recent activity yet.</div>
              ) : (
                recentActivity.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: idx < recentActivity.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ width: 36, height: 36, background: C.primary + "15", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Ic n="user" s={18} c={C.primary} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{item.role} • {fmtDate(item.created_at)}</div>
                    </div>
                    <Badge text={item.role} bg={item.role === "admin" ? "#FEE2E2" : item.role === "lecturer" ? "#D1FAE5" : "#DBEAFE"} color={item.role === "admin" ? "#EF4444" : item.role === "lecturer" ? "#10B981" : "#3B82F6"} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========== USER MANAGEMENT ========== */}
        {activeTab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>User Management</div>
                <div style={{ color: C.muted, fontSize: 14 }}>{filteredUsers.length} users found</div>
              </div>
              <button onClick={loadUsers} style={{ background: C.primary, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
                Refresh
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search name, email, matric..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ flex: 1, minWidth: 220, background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 14, color: C.text }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 14, color: C.text }}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Users Table */}
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: C.muted, fontWeight: 600 }}>NAME</th>
                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: C.muted, fontWeight: 600 }}>ROLE</th>
                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: C.muted, fontWeight: 600 }}>DEPARTMENT</th>
                    <th style={{ textAlign: "center", padding: "14px 20px", fontSize: 12, color: C.muted, fontWeight: 600 }}>STATUS</th>
                    <th style={{ textAlign: "right", padding: "14px 20px", fontSize: 12, color: C.muted, fontWeight: 600 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: C.muted }}>No users match your filters.</td></tr>
                  )}
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <Badge 
                          text={u.role} 
                          bg={u.role === "admin" ? "#FEE2E2" : u.role === "lecturer" ? "#D1FAE5" : "#DBEAFE"} 
                          color={u.role === "admin" ? "#EF4444" : u.role === "lecturer" ? "#10B981" : "#3B82F6"} 
                        />
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: C.muted }}>{u.department || "—"}</td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <button 
                          onClick={() => toggleActive(u.id, u.is_active ?? true)}
                          style={{ 
                            background: (u.is_active ?? true) ? "#10B98120" : "#EF444420", 
                            color: (u.is_active ?? true) ? "#10B981" : "#EF4444",
                            border: "none", 
                            padding: "4px 14px", 
                            borderRadius: 20, 
                            fontSize: 12, 
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          {(u.is_active ?? true) ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button 
                          onClick={() => openUser(u)}
                          style={{ background: C.primary, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== COURSE MANAGEMENT ========== */}
        {activeTab === "courses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>Course Management</div>
              <button onClick={() => openCourseEditor()} style={{ background: C.primary, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                + New Course
              </button>
            </div>

            <input
              type="text"
              placeholder="Search courses by code, title or department..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              style={{ width: "100%", maxWidth: 420, background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 14 }}
            />

            <div style={{ display: "grid", gap: 16 }}>
              {filteredCourses.map((course) => (
                <div key={course.id} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, background: (course.color || C.primary) + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic n="book" s={24} c={course.color || C.primary} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{course.code} — {course.title}</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
                      {course.department} • Level {course.level} • {course.semester} Semester • {course.units} units
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openAssignModal(course)} style={{ background: "#8B5CF620", color: "#8B5CF6", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                      Assign Lecturers
                    </button>
                    <button onClick={() => openCourseEditor(course)} style={{ background: C.primary + "15", color: C.primary, border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                      Edit
                    </button>
                    <button onClick={() => deleteCourse(course.id)} style={{ background: "#EF444420", color: "#EF4444", border: "none", padding: "10px 14px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredCourses.length === 0 && <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>No courses found.</div>}
            </div>
          </div>
        )}

        {/* ========== ENROLLMENT OVERSIGHT ========== */}
        {activeTab === "enrollments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>Enrollment Oversight</div>
                <div style={{ color: C.muted }}>{filteredEnrollments.length} enrollments</div>
              </div>
              <button onClick={exportEnrollmentsCSV} style={{ background: C.success, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
                Export CSV
              </button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search student or course..."
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                style={{ flex: 1, background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}
              />
              <select value={enrollFilterCourse} onChange={(e) => setEnrollFilterCourse(e.target.value)} style={{ background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", minWidth: 200 }}>
                <option value="all">All Courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>

            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: C.muted }}>STUDENT</th>
                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: C.muted }}>COURSE</th>
                    <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: C.muted }}>ENROLLED</th>
                    <th style={{ textAlign: "right", padding: "14px 20px", fontSize: 12, color: C.muted }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enr, idx) => (
                    <tr key={enr.id || idx} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 600 }}>{enr.profiles?.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{enr.profiles?.matric} • {enr.profiles?.department}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 600, color: enr.courses?.color || C.primary }}>{enr.courses?.code}</div>
                        <div style={{ fontSize: 13, color: C.muted }}>{enr.courses?.title}</div>
                      </td>
                      <td style={{ padding: "16px 20px", color: C.muted, fontSize: 13 }}>{fmtDate(enr.created_at)}</td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button style={{ background: "#EF444420", color: "#EF4444", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== SYSTEM TOOLS ========== */}
        {activeTab === "tools" && (
          <div style={{ maxWidth: 820 }}>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>System Tools</div>
            <div style={{ color: C.muted, marginBottom: 32 }}>Platform-wide actions and reports</div>

            {/* Global Announcement */}
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📢 Post Global Announcement</div>
              <input
                type="text"
                placeholder="Announcement title"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                style={{ width: "100%", background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 12, fontSize: 15 }}
              />
              <textarea
                placeholder="Write the announcement body..."
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                rows={4}
                style={{ width: "100%", background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, fontSize: 15, resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <select value={annPriority} onChange={(e) => setAnnPriority(e.target.value)} style={{ background: C.inputBg || C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
                  <option value="normal">Normal</option>
                  <option value="high">Urgent / High Priority</option>
                </select>
                <button onClick={postGlobalAnnouncement} style={{ background: C.primary, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                  Post to All Users
                </button>
              </div>
              {toolMessage && <div style={{ marginTop: 12, color: toolMessage.startsWith("✅") ? C.success : C.danger }}>{toolMessage}</div>}
            </div>

            {/* Reports */}
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📊 Export Reports</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => exportReport("users")} style={{ background: C.info, color: "#fff", border: "none", padding: "14px 24px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
                  Export All Users (CSV)
                </button>
                <button onClick={() => exportReport("enrollments")} style={{ background: C.success, color: "#fff", border: "none", padding: "14px 24px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
                  Export Enrollments (CSV)
                </button>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 16 }}>Reports are generated instantly from current database state.</div>
            </div>
          </div>
        )}
      </div>

      {/* ========== USER DETAIL MODAL ========== */}
      {showUserModal && selectedUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowUserModal(false)}>
          <div style={{ background: C.card, borderRadius: 20, width: "100%", maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Manage User</div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.muted }}>FULL NAME</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedUser.name}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.muted }}>EMAIL / MATRIC</div>
              <div>{selectedUser.email} {selectedUser.matric && `• ${selectedUser.matric}`}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>CHANGE ROLE</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["student", "lecturer", "admin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => updateUserRole(selectedUser.id, r)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      border: selectedUser.role === r ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                      background: selectedUser.role === r ? C.primary + "10" : C.card,
                      fontWeight: 600,
                      color: selectedUser.role === r ? C.primary : C.text,
                      cursor: "pointer"
                    }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => toggleActive(selectedUser.id, selectedUser.is_active ?? true)}
                style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, border: "none", background: (selectedUser.is_active ?? true) ? "#EF4444" : "#10B981", color: "#fff", cursor: "pointer" }}
              >
                {(selectedUser.is_active ?? true) ? "Deactivate Account" : "Activate Account"}
              </button>
              <button onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: C.card, color: C.text, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== COURSE EDIT MODAL ========== */}
      {showCourseModal && editingCourse && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowCourseModal(false)}>
          <div style={{ background: C.card, borderRadius: 20, width: "100%", maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>{editingCourse.id ? "Edit Course" : "Create New Course"}</div>

            <div style={{ display: "grid", gap: 14 }}>
              <input placeholder="Course Code (e.g. CSC 301)" value={editingCourse.code} onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg || C.card }} />
              <input placeholder="Course Title" value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg || C.card }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input placeholder="Department" value={editingCourse.department || ""} onChange={(e) => setEditingCourse({ ...editingCourse, department: e.target.value })} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg || C.card }} />
                <input placeholder="Faculty" value={editingCourse.faculty || ""} onChange={(e) => setEditingCourse({ ...editingCourse, faculty: e.target.value })} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg || C.card }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <input type="number" placeholder="Level" value={editingCourse.level} onChange={(e) => setEditingCourse({ ...editingCourse, level: parseInt(e.target.value) || 100 })} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg || C.card }} />
                <select value={editingCourse.semester} onChange={(e) => setEditingCourse({ ...editingCourse, semester: e.target.value })} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg || C.card }}>
                  <option>First</option><option>Second</option>
                </select>
                <input type="number" placeholder="Units" value={editingCourse.units} onChange={(e) => setEditingCourse({ ...editingCourse, units: parseInt(e.target.value) || 3 })} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg || C.card }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={saveCourse} style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, background: C.primary, color: "#fff", border: "none", cursor: "pointer" }}>
                {editingCourse.id ? "Save Changes" : "Create Course"}
              </button>
              <button onClick={() => { setShowCourseModal(false); setEditingCourse(null); }} style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ASSIGN LECTURERS MODAL ========== */}
      {assigningCourse && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setAssigningCourse(null)}>
          <div style={{ background: C.card, borderRadius: 20, width: "100%", maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Assign Lecturers</div>
            <div style={{ color: C.muted, marginBottom: 20 }}>{assigningCourse.code} — {assigningCourse.title}</div>

            <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 20 }}>
              {lecturers.length === 0 && <div style={{ color: C.muted, padding: 20 }}>No active lecturers found.</div>}
              {lecturers.map((lec) => (
                <label key={lec.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedLecturers.includes(lec.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLecturers([...selectedLecturers, lec.id]);
                      } else {
                        setSelectedLecturers(selectedLecturers.filter((id) => id !== lec.id));
                      }
                    }}
                    style={{ width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{lec.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{lec.department}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={saveLecturerAssignments} style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, background: C.primary, color: "#fff", border: "none", cursor: "pointer" }}>
                Save Assignments
              </button>
              <button onClick={() => { setAssigningCourse(null); setSelectedLecturers([]); }} style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
