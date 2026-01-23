const categories = [
  "All",
  "Environment",
  "Infrastructure",
  "Education",
  "Public Safety",
  "Healthcare",
  "Housing",
];

export default function CategoryFilter() {
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {categories.map((category) => (
        <button
          key={category}
          className="px-4 py-1.5 rounded-full border text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition"
        >
          {category}
        </button>
      ))}
    </div>
  );
}
