const STATUSES = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Under Review", value: "under_review" },
  { label: "Closed", value: "closed" },
];

export default function StatusFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {STATUSES.map((status) => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`px-4 py-1.5 rounded-full border text-sm transition
            ${
              value === status.value
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
            }
          `}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
