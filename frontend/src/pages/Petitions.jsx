import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import PetitionCard from "../components/PetitionCard";
import CategoryFilter from "../components/CategoryFilter";

export default function Petitions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "active";

  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("citizen");
  const [verificationStatus, setVerificationStatus] = useState("unverified");

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const params = {};
    if (status) params.status = status;
    setSearchParams(params);
  }, [status, setSearchParams]);

  useEffect(() => {
    fetchPetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  const fetchPetitions = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");

      if (!token || !userRaw) {
        setPetitions([]);
        return;
      }

      const user = JSON.parse(userRaw);
      setUserRole(user?.role || "citizen");
      setVerificationStatus(user?.verificationStatus || "unverified");

      const city = user?.location?.jurisdiction?.city || user?.location?.address || "all";

      const statusMap = {
        approved: "completed",
        rejected: "closed",
      };

      const res = await axios.get("http://localhost:5000/api/petitions", {
        params: {
          location: city,
          category,
          status: statusMap[status] || status,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPetitions(res.data.petitions || []);
    } catch (err) {
      console.error("Failed to fetch petitions", err);
      setPetitions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Petitions"
        subtitle="Browse, sign, and track petitions in your community"
        action={userRole === "citizen" ? (
          <Button onClick={() => navigate("/create")}>
            + Create Petition
          </Button>
        ) : null}
      />

      <div className="mt-2 pb-3 border-b flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto whitespace-nowrap">
          {[
            { key: "active", label: "Active Petitions" },
            { key: "under_review", label: "Under Review" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => {
            const active = status === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key)}
                className={`flex items-center gap-2 pb-2 text-sm font-medium transition ${
                  active
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 xl:shrink-0 xl:ml-auto">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-gray-500">Loading petitions...</p>
        ) : petitions.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No petitions found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {petitions.map((p) => {
              const latestRejection = [...(p.officialResponses || [])]
                .reverse()
                .find((r) => r?.statusAfterUpdate === "closed");
              const latestUnderReview = [...(p.officialResponses || [])]
                .reverse()
                .find((r) => r?.statusAfterUpdate === "under_review");

              return (
                <PetitionCard
                  key={p._id}
                  _id={p._id}
                  title={p.title}
                  category={p.category}
                  description={p.description}
                  location={p.location?.jurisdiction?.city || p.location?.address}
                  current={p.signature_count}
                  target={p.target_signatures}
                  author={p.creator_name}
                  status={p.status}
                  has_signed={p.has_signed}
                  userRole={userRole}
                  verificationStatus={verificationStatus}
                  onPetitionUpdated={fetchPetitions}
                  rejectionFeedback={latestRejection?.comment || ""}
                  underReviewFeedback={latestUnderReview?.comment || ""}
                />
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
