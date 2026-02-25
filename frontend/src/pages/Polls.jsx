import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapPin, Calendar, BarChart2 } from "lucide-react";

import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";

export default function Polls() {
  const navigate = useNavigate();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState({});
  const [filter, setFilter] = useState("active");
  const [userRole, setUserRole] = useState("citizen");
  const [verificationStatus, setVerificationStatus] = useState("unverified");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [deletingPollId, setDeletingPollId] = useState("");
  const [confirmDeletePoll, setConfirmDeletePoll] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "info",
  });
  const [resultsPollId, setResultsPollId] = useState(null);

  const showNotification = (message, type = "info") => {
    setNotification({ open: true, message, type });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        setUserRole(parsed?.role || "citizen");
        setVerificationStatus(parsed?.verificationStatus || "unverified");
        const city = parsed?.location?.jurisdiction?.city || parsed?.location?.address || "";
        setLocationFilter(city);
      } catch (error) {
        console.error("Failed to parse user", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!notification.open) return;
    const timer = setTimeout(() => {
      closeNotification();
    }, 2800);

    return () => clearTimeout(timer);
  }, [notification.open]);

  useEffect(() => {
    fetchPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/polls", {
        params: locationFilter ? { location: locationFilter } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPolls(res.data.polls || []);
    } catch (err) {
      console.error("Failed to fetch polls", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "No end date";
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? "No end date" : d.toLocaleDateString();
  };

  const totalVotes = (options = []) =>
    options.reduce((sum, o) => sum + (o.votes || 0), 0);

  const getVotePercent = (optionVotes, options = []) => {
    const total = totalVotes(options);
    if (!total) return 0;
    return (optionVotes / total) * 100;
  };

  const chartColors = ["#2563eb", "#14b8a6", "#f97316", "#8b5cf6", "#f43f5e", "#0ea5e9"];

  const token = localStorage.getItem("token");
  const isOfficialVerified = userRole !== "official" || verificationStatus === "verified";

  const filteredPolls = polls.filter((poll) => {
    if (filter === "active") return poll.status === "active";
    if (filter === "closed") return poll.status === "closed";
    if (filter === "voted") return !!poll.hasVoted;
    if (filter === "mine") return !!poll.isMine;
    return true;
  });

  const resultsPoll = resultsPollId
    ? polls.find((poll) => poll._id === resultsPollId)
    : null;

  const resultsTotalVotes = resultsPoll ? totalVotes(resultsPoll.options) : 0;

  const pieStops = resultsPoll?.options?.length
    ? (() => {
        let currentPercent = 0;
        const stops = resultsPoll.options.map((opt, idx) => {
          const percent = getVotePercent(opt.votes || 0, resultsPoll.options);
          const start = currentPercent;
          currentPercent += percent;
          return `${chartColors[idx % chartColors.length]} ${start}% ${currentPercent}%`;
        });

        if (!resultsTotalVotes) {
          return "#e5e7eb 0% 100%";
        }

        return stops.join(", ");
      })()
    : "#e5e7eb 0% 100%";

  const handleVote = async (pollId) => {
    const optionIndex = selectedOption[pollId];
    if (optionIndex === undefined) {
      showNotification("Please select an option", "error");
      return;
    }

    try {
      const tokenVal = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/polls/${pollId}/vote`,
        { optionIndex },
        {
          headers: {
            Authorization: `Bearer ${tokenVal}`,
          },
        }
      );

      showNotification("Vote recorded successfully.", "success");
      fetchPolls();
    } catch (err) {
      showNotification(err.response?.data?.message || "Voting failed", "error");
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      setStatusUpdatingId(pollId);
      await axios.patch(
        `http://localhost:5000/api/polls/${pollId}/status`,
        { status: "closed" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showNotification("Poll closed successfully.", "success");
      fetchPolls();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to close poll", "error");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleDeletePoll = async () => {
    if (!confirmDeletePoll) return;

    try {
      setDeletingPollId(confirmDeletePoll._id);
      await axios.delete(`http://localhost:5000/api/polls/${confirmDeletePoll._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setConfirmDeletePoll(null);
      showNotification("Poll deleted successfully.", "success");
      fetchPolls();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to delete poll", "error");
    } finally {
      setDeletingPollId("");
    }
  };

  const tabs = userRole === "official"
    ? [
        { key: "active", label: "Active Polls" },
        { key: "closed", label: "Closed Polls" },
      ]
    : [
        { key: "active", label: "Active Polls" },
        { key: "voted", label: "Polls I Voted On", requiresAuth: true },
        { key: "mine", label: "My Polls", requiresAuth: true },
        { key: "closed", label: "Closed Polls" },
      ];

  return (
    <Container className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Polls"
        subtitle={
          userRole === "official"
            ? "Create issue-specific polls, monitor sentiment, and manage poll status."
            : "Participate in community polls and make your voice heard"
        }
        action={userRole === "official" ? (
          <Button
            onClick={() => navigate("/polls/create")}
            disabled={!isOfficialVerified}
          >
            + Create Poll
          </Button>
        ) : null}
      />

      <div className="flex flex-wrap gap-3 sm:gap-4 border-b mt-2 overflow-x-auto whitespace-nowrap">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          const disabled = tab.requiresAuth && !token;

          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              disabled={disabled}
              className={`pb-2 text-sm font-medium transition ${
                active
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-gray-500">Loading polls...</p>
        ) : filteredPolls.length === 0 ? (
          <p className="text-gray-500">No polls found.</p>
        ) : (
          <div className="space-y-6">
            {filteredPolls.map((poll) => (
              <div key={poll._id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{poll.title}</h3>

                <p className="text-sm text-gray-600 mb-3">{poll.description}</p>

                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {poll.targetLocation || "Unknown location"}
                  </span>

                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(poll.expiresAt)}
                  </span>

                  <span className="flex items-center gap-1">
                    <BarChart2 size={14} />
                    {totalVotes(poll.options)} votes
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {poll.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={poll._id}
                          disabled={
                            poll.status === "closed" ||
                            userRole !== "citizen"
                          }
                          onChange={() =>
                            setSelectedOption({
                              ...selectedOption,
                              [poll._id]: idx,
                            })
                          }
                        />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">{opt.votes} votes</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {poll.status === "active" &&
                  userRole === "citizen" ? (
                    <Button size="sm" onClick={() => handleVote(poll._id)}>
                      Vote
                    </Button>
                  ) : poll.status === "active" && userRole === "official" ? (
                    <Button size="sm" variant="secondary" disabled>
                      Officials cannot vote
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" disabled>
                      Poll Closed
                    </Button>
                  )}

                  <Button size="sm" variant="secondary" onClick={() => setResultsPollId(poll._id)}>
                    View Results
                  </Button>

                  {userRole === "official" && poll.status === "active" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={statusUpdatingId === poll._id || !isOfficialVerified}
                      onClick={() => handleClosePoll(poll._id)}
                    >
                      {statusUpdatingId === poll._id ? "Closing..." : "Close Poll"}
                    </Button>
                  ) : null}

                  {userRole === "official" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!isOfficialVerified || deletingPollId === poll._id}
                      onClick={() => setConfirmDeletePoll({ _id: poll._id, title: poll.title })}
                    >
                      {deletingPollId === poll._id ? "Deleting..." : "Delete Poll"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDeletePoll ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete Poll</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete <span className="font-medium">"{confirmDeletePoll.title}"</span> permanently?
              This action cannot be undone and the poll will be removed from the database.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                onClick={() => setConfirmDeletePoll(null)}
                disabled={Boolean(deletingPollId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
                onClick={handleDeletePoll}
                disabled={Boolean(deletingPollId)}
              >
                {deletingPollId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`fixed inset-0 z-40 flex items-center justify-center px-4 transition-opacity duration-300 ${
          resultsPoll ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/35" onClick={() => setResultsPollId(null)} />
        <div
          className={`relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl transition-all duration-300 sm:p-6 ${
            resultsPoll ? "translate-y-0 scale-100" : "translate-y-2 scale-95"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="poll-results-title"
        >
          {resultsPoll && (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 id="poll-results-title" className="text-lg font-bold text-gray-900">
                    {resultsPoll.title}
                  </h3>
                  <p className="text-sm text-gray-500">{resultsTotalVotes} total votes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setResultsPollId(null)}
                  className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close results"
                >
                  x
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-[220px,1fr] md:items-center">
                <div className="mx-auto h-48 w-48">
                  <div
                    className="h-full w-full rounded-full border-8 border-white shadow-inner"
                    style={{ background: `conic-gradient(${pieStops})` }}
                  />
                </div>

                <div className="space-y-3">
                  {resultsPoll.options.map((opt, idx) => {
                    const votes = opt.votes || 0;
                    const percent = getVotePercent(votes, resultsPoll.options);

                    return (
                      <div key={idx}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: chartColors[idx % chartColors.length],
                              }}
                            />
                            <span className="text-gray-800">{opt.label}</span>
                          </div>
                          <span className="text-gray-500">
                            {votes} votes ({percent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: chartColors[idx % chartColors.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          notification.open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" onClick={closeNotification} />
        <div
          className={`relative w-[90%] max-w-md rounded-2xl border px-5 py-4 shadow-2xl transition-all duration-300 ${
            notification.open ? "translate-y-0 scale-100" : "translate-y-3 scale-95"
          } ${
            notification.type === "error"
              ? "bg-red-50 border-red-200"
              : "bg-white border-gray-200"
          }`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <p
            className={`pr-8 text-sm font-medium ${
              notification.type === "error" ? "text-red-700" : "text-gray-800"
            }`}
          >
            {notification.message}
          </p>
          <button
            type="button"
            onClick={closeNotification}
            className="absolute right-3 top-2 text-lg leading-none text-gray-500 hover:text-gray-700"
            aria-label="Close notification"
          >
            x
          </button>
        </div>
      </div>
    </Container>
  );
}
