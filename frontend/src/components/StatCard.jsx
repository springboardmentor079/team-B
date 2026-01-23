function StatCard({ title, value, subtitle }) {
  return (
    <div
      className="p-lg"
      style={{
        background: "var(--white)",
        borderRadius: "var(--border-radius-lg)",
        boxShadow: "var(--shadow-sm)",
        minWidth: 200,
      }}
    >
      <h1 className="m-0">{value}</h1>
      <p className="font-semibold">{title}</p>
      <span className="text-muted text-sm">{subtitle}</span>
    </div>
  );
}

export default StatCard;
