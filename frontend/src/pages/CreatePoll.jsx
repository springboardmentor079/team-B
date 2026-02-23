import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import axios from "axios";
import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";

export default function CreatePoll() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("unverified");

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    try {
      const parsed = JSON.parse(rawUser);
      setUserRole(parsed?.role || "");
      setVerificationStatus(parsed?.verificationStatus || "unverified");
    } catch (error) {
      console.error("Failed to parse user", error);
    }
  }, []);

  /* ---------------- OPTIONS HANDLERS ---------------- */
  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  /* ---------------- SUBMIT ---------------- */


const handleSubmit = async (e) => {
  e.preventDefault();

  const validOptions = options.filter(o => o.trim() !== "");

  if (!question || !description || validOptions.length < 2 || !location || !closeDate) {
    alert("Please fill all required fields");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    await axios.post(
      "http://localhost:5000/api/polls",
      {
        title: question,
        description,
        targetLocation: location,
        expiresAt: closeDate,
        options: validOptions,
        category: "other",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setShowSuccess(true);
  } catch (err) {
    console.error("Create poll failed", err);
    alert("Failed to create poll");
  }
};

  return (
    <Container className="h-full flex flex-col overflow-y-auto">
      {userRole && userRole !== "official" ? (
        <div className="max-w-xl mx-auto mt-8 w-full px-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
            <p className="text-sm text-gray-600 mt-2">
              Only officials can create polls.
            </p>
            <div className="mt-4">
              <Button onClick={() => navigate("/polls")}>Back to Polls</Button>
            </div>
          </div>
        </div>
      ) : null}

      {userRole === "official" && verificationStatus !== "verified" ? (
        <div className="max-w-xl mx-auto mt-8 w-full px-4">
          <div className="bg-white border border-amber-200 rounded-xl shadow-sm p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Verification Required</h3>
            <p className="text-sm text-gray-600 mt-2">
              Your official account is not verified. Submit Government ID in Verification Status to create polls.
            </p>
            <div className="mt-4">
              <Button onClick={() => navigate("/verification-status")}>Go to Verification Status</Button>
            </div>
          </div>
        </div>
      ) : null}

      {userRole && (userRole !== "official" || verificationStatus !== "verified") ? null : (
      <>
      {/* PAGE HEADER */}
      <PageHeader
        title="Create Poll"
        subtitle="Ask your community and gather opinions"
      />

      {/* CENTERED FORM */}
      <div className="flex justify-center py-6 sm:py-8 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-8 space-y-6"
        >
          {/* QUESTION */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Poll Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should the city prioritize?"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide context for the poll"
              className="w-full border rounded-lg px-4 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* OPTIONS */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Poll Options
            </label>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="self-start sm:self-auto p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Plus size={16} /> Add option
            </button>
          </div>

          {/* LOCATION */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Target Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Patiala"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* CLOSE DATE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Close Date
            </label>
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* INFO BOX */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            Your poll will be reviewed before being published. Please keep the
            question neutral and respectful.
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate("/polls")}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Create Poll
            </Button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center font-semibold">
              ✓
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Poll created successfully
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your poll has been submitted and will appear shortly.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                navigate("/polls");
              }}
              className="mt-6 w-full px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
            >
              Go to Polls
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </Container>
  );
}
