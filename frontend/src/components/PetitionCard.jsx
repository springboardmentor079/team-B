import { useState } from "react";
import axios from "axios";
import Button from "./ui/Button";

export default function PetitionCard({
  _id,
  title = "Untitled Petition",
  category = "General",
  location = "Unknown location",
  description = "",
  current = 0,
  target = 1,
  author = "Anonymous",
  status = "active",
  has_signed = false,
}) {
  const [signed, setSigned] = useState(has_signed);
  const [count, setCount] = useState(current);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const progress = Math.min((count / target) * 100, 100);

  const handleSign = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to sign petitions");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `http://localhost:5000/api/petitions/${_id}/sign`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSigned(true);
      setCount(res.data.signature_count);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to sign petition"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
      
      {/* Category */}
      <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 mb-2">
        {category.toUpperCase()}
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
            {count} / {target} signatures
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              status === "successful"
                ? "bg-green-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <Button variant="secondary" size="sm" onClick={() => setShowDetails(true)}>
          View Details
        </Button>

        {status !== "active" ? (
          <span className="text-green-600 text-sm font-medium self-center">
            ✓ Successful
          </span>
        ) : signed ? (
          <span className="text-blue-600 text-sm font-medium self-center">
            ✓ Signed
          </span>
        ) : (
          <Button
            size="sm"
            onClick={handleSign}
            disabled={loading}
          >
            {loading ? "Signing..." : "Sign Petition"}
          </Button>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {category.toUpperCase()}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {location} • by {author}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700 leading-relaxed">
              {description ? description : "No description provided."}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
