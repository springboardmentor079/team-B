const categories = [
  { label: "Category: All", value: "all" },
  { label: "Local Government", value: "local-government" },
  { label: "Environment", value: "environment" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Education", value: "education" },
  { label: "Public Safety", value: "public-safety" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Transportation", value: "transportation" },
  { label: "Housing", value: "housing" },
  { label: "Other", value: "other" },
];

export default function CategoryFilter({
  value = "all",
  onChange,
  className = "",
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full sm:w-auto border rounded-lg px-3 py-1.5 text-sm bg-white ${className}`}
    >
      {categories.map((category) => (
        <option key={category.value} value={category.value}>
          {category.label}
        </option>
      ))}
    </select>
  );
}
