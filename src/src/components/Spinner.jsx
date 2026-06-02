export default function Spinner({ fullPage = true }) {
  const inner = (
    <>
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #E8E8E8",
          borderTop: "3px solid #1B4332",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );

  if (!fullPage) return <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>{inner}</div>;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      {inner}
    </div>
  );
}
