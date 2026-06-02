import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || "An unexpected error occurred.";
      const isConfig = msg.includes("VITE_SUPABASE");
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "Inter, sans-serif",
            background: "linear-gradient(160deg, #1B4332 0%, #2D6A4F 60%, #1B4332 100%)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 32,
              maxWidth: 400,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>{isConfig ? "⚙️" : "⚠️"}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", marginBottom: 8 }}>
              {isConfig ? "App Not Configured" : "Something Went Wrong"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6B6B6B",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              {isConfig
                ? "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
                : msg}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#1B4332",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                width: "100%",
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
