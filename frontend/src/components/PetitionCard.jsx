import { useState } from "react";
import axios from "axios";
import Button from "./ui/Button";

const statusLabelMap = {
  active: "Active",
  under_review: "Under Review",
  completed: "Approved",
  closed: "Rejected",
};

const statusColorMap = {
  active: "text-blue-600",
  under_review: "text-amber-600",
  completed: "text-green-600",
  closed: "text-red-600",
};

const ActionIcon = ({ type }) => {
  if (type === "review") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 12h10M4 18h8" />
      </svg>
    );
  }
  if (type === "approve") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m5 12 4 4 10-10" />
      </svg>
    );
  }
  if (type === "reject") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
    </svg>
  );
};

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
  userRole = "citizen",
  verificationStatus = "unverified",
  onPetitionUpdated,
  rejectionFeedback = "",
  underReviewFeedback = "",
}) {
  const [signed, setSigned] = useState(has_signed);
  const [count, setCount] = useState(current);
  const [petitionStatus, setPetitionStatus] = useState(status);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [remark, setRemark] = useState("");
  const [notice, setNotice] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const progress = Math.min((count / target) * 100, 100);

  const showNotice = (message, type = "success") => {
    setNotice({ open: true, message, type });
    setTimeout(() => {
      setNotice((prev) => ({ ...prev, open: false }));
    }, 2500);
  };

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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSigned(true);
      setCount(res.data.signature_count);
      onPetitionUpdated?.();
      showNotice("Petition signed successfully.");
    } catch (error) {
      showNotice(error.response?.data?.message || "Failed to sign petition", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOfficialStatusUpdate = async (nextStatus, actionLabel) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!remark || remark.trim().length < 5) {
      showNotice("Please add a remark of at least 5 characters.", "error");
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        `http://localhost:5000/api/petitions/${_id}/respond`,
        { comment: remark.trim(), status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPetitionStatus(nextStatus);
      setRemark("");
      onPetitionUpdated?.();
      showNotice(`Petition marked as ${actionLabel}.`);
    } catch (error) {
      showNotice(error.response?.data?.message || "Failed to update petition status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePetition = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setActionLoading(true);
      await axios.delete(`http://localhost:5000/api/petitions/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteConfirm(false);
      onPetitionUpdated?.();
      showNotice("Petition deleted successfully.");
    } catch (error) {
      showNotice(error.response?.data?.message || "Failed to delete petition", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const isOfficial = userRole === "official";
  const isOfficialVerified = verificationStatus === "verified";
  const canModerate = isOfficial && (petitionStatus === "active" || petitionStatus === "under_review");
  const canShowOfficialActions = isOfficial;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition h-full flex flex-col">
      <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 mb-2">
        {category.toUpperCase()}
      </span>

      <h3 className="text-lg font-semibold text-gray-900 leading-snug min-h-[3.5rem]">
        {title}
      </h3>

      <p className="text-sm text-gray-500 mt-1 min-h-[1.25rem]">
        {location} - by {author}
      </p>

      <div className="mt-2 text-sm font-medium min-h-[1.25rem] flex items-center">
        <span className={statusColorMap[petitionStatus] || "text-gray-600"}>
          {statusLabelMap[petitionStatus] || petitionStatus}
        </span>
      </div>

      {petitionStatus === "closed" && rejectionFeedback ? (
        <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <p className="text-xs font-medium text-red-700">Official Feedback</p>
          <p className="text-sm text-red-800 mt-1">{rejectionFeedback}</p>
        </div>
      ) : null}

      {petitionStatus === "under_review" && underReviewFeedback ? (
        <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <p className="text-xs font-medium text-amber-700">Official Feedback</p>
          <p className="text-sm text-amber-800 mt-1">{underReviewFeedback}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{count} / {target} signatures</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              petitionStatus === "completed"
                ? "bg-green-500"
                : petitionStatus === "closed"
                ? "bg-red-500"
                : petitionStatus === "under_review"
                ? "bg-amber-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap mt-auto pt-4">
        <Button variant="secondary" size="sm" onClick={() => setShowDetails(true)}>
          View Details
        </Button>

        {petitionStatus !== "active" ? (
          <span className={`text-sm font-medium self-center ${statusColorMap[petitionStatus] || "text-gray-600"}`}>
            {statusLabelMap[petitionStatus] || petitionStatus}
          </span>
        ) : isOfficial ? (
          <span className="text-gray-600 text-sm font-medium self-center">
            {isOfficialVerified ? "Official review enabled" : "Verification required for actions"}
          </span>
        ) : signed ? (
          <span className="text-blue-600 text-sm font-medium self-center">
            Signed
          </span>
        ) : (
          <Button size="sm" onClick={handleSign} disabled={loading}>
            {loading ? "Signing..." : "Sign Petition"}
          </Button>
        )}
      </div>

      {canShowOfficialActions ? (
        <div className="mt-4 border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600">Official Review Actions</p>
          {canModerate ? (
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Add remark before status update..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={!isOfficialVerified}
            />
          ) : (
            <div className="w-full border rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">
              This petition is finalized. Status actions are disabled.
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`w-full min-h-[56px] px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                canModerate && petitionStatus === "active"
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-gray-100 text-gray-500 cursor-not-allowed"
              }`}
              disabled={actionLoading || !isOfficialVerified || !canModerate || petitionStatus !== "active"}
              onClick={() => handleOfficialStatusUpdate("under_review", "Under Review")}
            >
              <ActionIcon type="review" />
              {canModerate && petitionStatus === "active" ? "Mark Under Review" : "Under Review"}
            </button>
            <button
              type="button"
              className={`w-full min-h-[56px] px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2 ${
                canModerate
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-100 text-gray-500 cursor-not-allowed"
              }`}
              disabled={actionLoading || !isOfficialVerified || !canModerate}
              onClick={() => handleOfficialStatusUpdate("completed", "Approved")}
            >
              <ActionIcon type="approve" />
              Approve
            </button>
            <button
              type="button"
              className={`w-full min-h-[56px] px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2 ${
                canModerate
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-gray-100 text-gray-500 cursor-not-allowed"
              }`}
              disabled={actionLoading || !isOfficialVerified || !canModerate}
              onClick={() => handleOfficialStatusUpdate("closed", "Rejected")}
            >
              <ActionIcon type="reject" />
              Reject
            </button>
            <button
              type="button"
              className="w-full min-h-[56px] px-3 py-2 rounded-lg text-sm font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60 flex items-center justify-center gap-2"
              disabled={actionLoading || !isOfficialVerified}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <ActionIcon type="delete" />
              Delete Petition
            </button>
          </div>
        </div>
      ) : null}

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">{category.toUpperCase()}</p>
                <h3 className="text-lg font-semibold text-gray-900 mt-1">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{location} - by {author}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close details"
              >
                x
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700 leading-relaxed">
              {description || "No description provided."}
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Petition
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete this petition permanently? This action
              cannot be undone and the petition will be removed from the database.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
                onClick={handleDeletePetition}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {notice.open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 pointer-events-none">
          <div
            className={`w-full max-w-sm rounded-xl border px-4 py-3 shadow-xl ${
              notice.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium">{notice.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
