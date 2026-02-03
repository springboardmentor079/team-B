const categories = [
  "all",
  "Environment",
  "Infrastructure",
  "Education",
  "Public Safety",
  "Healthcare",
  "Housing",
];

export default function CategoryFilter({ value = "all", onChange }) {
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {categories.map((category) => {
        const isActive =
          value.toLowerCase() === category.toLowerCase();

        return (
          <button
            key={category}
            onClick={() => onChange(category.toLowerCase())}
            className={`
              px-4 py-1.5 rounded-full border text-sm transition
              ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
              }
            `}
          >
            {category === "all" ? "All" : category}
          </button>
        );
      })}
    </div>
  );
}
