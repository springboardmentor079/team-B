import Button from "./ui/Button";

export default function PetitionCard({
  title = "Untitled Petition",
  category = "General",
  location = "Unknown location",
  current = 0,
  target = 1,
  author = "Anonymous",
  status = "active",
}) {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
      
      {/* Category */}
      <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 mb-2">
        {category?.toUpperCase() || "GENERAL"}

      </span>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {/* Meta */}
      <p className="text-sm text-gray-500 mt-1">
        {location} • by {author}
      </p>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>
            {current} / {target} signatures
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              status === "successful" ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <Button variant="secondary" size="sm">
          View Details
        </Button>

        {status === "active" ? (
          <Button size="sm">Sign Petition</Button>
        ) : (
          <span className="text-green-600 text-sm font-medium self-center">
            ✓ Successful
          </span>
        )}
      </div>
    </div>
  );
}
