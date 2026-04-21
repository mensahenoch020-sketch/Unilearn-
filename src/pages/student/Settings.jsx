import { useState } from "react";
import { supabase } from "../../supabase.js";
import Ic from "../../components/Ic.jsx";

export default function Settings({ user, setUser, C, onLogout }) {
  const [name, setName] = useState(user?.name || "");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const inp = {
    width: "100%",
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 14,
    background: C.inputBg,
    color: C.text,
    outline: "none",
    fontFamily: "Inter,sans-serif",
  };

  const flash = (type, msg) => {
    if (type === "success") { setMessage(msg); setError(""); }
    else { setError(msg); setMessage(""); }
  };

  const saveName = async () => {
    if (!name.trim()) return flash("error", "Name cannot be empty.");
    setLoading(true);
    const { error: e } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", user.id);
    setLoading(false);
    if (e) return flash("error", e.message);
    setUser({ ...user, name: name.trim() });
    flash("success", "Name updated successfully!");
  };

  const changePassword = async () => {
    if (!newPw || !confirmPw) return flash("error", "Please fill in both password fields.");
    if (newPw !== confirmPw) return flash("error", "Passwords do not match.");
    if (newPw.length < 6) return flash("error", "Password must be at least 6 characters.");
    setLoading(true);
    const { error: e } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (e) return flash("error", e.message);
    setNewPw("");
    setConfirmPw("");
    flash("success", "Password changed successfully!");
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return flash("error", "Avatar must be under 5MB.");
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${ext}`;
    const { error: ue } = await supabase.storage.from("unilearn").upload(filePath, file, { upsert: true });
    if (ue) { flash("error", "Avatar upload failed."); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("unilearn").getPublicUrl(filePath);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setAvatarUrl(urlData.publicUrl);
    setUser({ ...user, avatar_url: urlData.publicUrl });
    setUploadingAvatar(false);
    flash("success", "Profile picture updated!");
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: C.text, letterSpacing: -0.5 }}>
        Settings
      </div>

      {/* Profile card */}
      <div style={{ background: C.card, borderRadius: 20, padding: 24, marginBottom: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
        <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 16px" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Ic n="user" s={40} c="#fff" />
            )}
          </div>
          <label
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: "#F4A261",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Ic n="camera" s={14} c="#fff" />
            <input type="file" style={{ display: "none" }} accept="image/*" onChange={uploadAvatar} />
          </label>
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{user?.email}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
          {user?.role} · {user?.department}
        </div>
        {user?.matric && <div style={{ fontSize: 12, color: C.muted }}>Matric: {user?.matric}</div>}
        {user?.faculty && <div style={{ fontSize: 12, color: C.muted }}>Faculty of {user?.faculty}</div>}
        {uploadingAvatar && <div style={{ fontSize: 12, color: C.primary, marginTop: 8 }}>Uploading photo...</div>}
      </div>

      {/* Feedback banners */}
      {message && (
        <div style={{ background: "#D1FAE5", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
          ✓ {message}
        </div>
      )}
      {error && (
        <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Edit name */}
      <div style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Ic n="user" s={18} c={C.primary} /> Edit Name
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Full Name</label>
          <input style={inp} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button
          onClick={saveName}
          disabled={loading}
          style={{
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "13px 0",
            width: "100%",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Inter,sans-serif",
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Change password */}
      <div style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Ic n="lock" s={18} c={C.primary} /> Change Password
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>New Password</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inp, paddingRight: 44 }}
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 6 characters"
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
              <Ic n={showPw ? "eyeOff" : "eye"} s={18} c={C.muted} />
            </button>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Confirm New Password</label>
          <input
            style={inp}
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Repeat new password"
          />
        </div>
        <button
          onClick={changePassword}
          disabled={loading}
          style={{
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "13px 0",
            width: "100%",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Inter,sans-serif",
          }}
        >
          {loading ? "Updating..." : "Change Password"}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={onLogout}
        style={{
          background: "#FEE2E2",
          color: "#EF4444",
          border: "none",
          borderRadius: 14,
          padding: "16px 0",
          width: "100%",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "Inter,sans-serif",
        }}
      >
        <Ic n="logout" s={18} c="#EF4444" /> Sign Out
      </button>
    </div>
  );
}
