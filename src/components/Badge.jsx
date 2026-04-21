export default function Badge({ text, bg, color }) {
  return (
    <span
      style={{
        background: bg,
        color,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}
