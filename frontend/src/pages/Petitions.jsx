import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import {
  FileText,
  User,
  CheckCircle,
} from "lucide-react";

import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import PetitionCard from "../components/PetitionCard";
import CategoryFilter from "../components/CategoryFilter";

export default function Petitions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ---------------- READ FROM URL ---------------- */
  const initialScope = searchParams.get("scope") || "all";
  const initialStatus = searchParams.get("status") || "all";

  /* ---------------- STATE ---------------- */
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState(initialStatus);
  const [scope, setScope] = useState(initialScope);

  /* ---------------- KEEP URL IN SYNC (FIXED) ---------------- */
  useEffect(() => {
    const params = {};

    if (scope !== "all") params.scope = scope;
    if (status !== "all") params.status = status;

    setSearchParams(params);
  }, [scope, status, setSearchParams]);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    fetchPetitions();
    // eslint-disable-next-line
  }, [category, status, scope]);

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

      const city =
        user?.location?.jurisdiction?.city ||
        user?.location?.address ||
        "all";

      const res = await axios.get(
        "http://localhost:5000/api/petitions",
        {
          params: {
            location: city,
            category,
            status,
            scope,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPetitions(res.data.petitions || []);
    } catch (err) {
      console.error("Failed to fetch petitions", err);
      setPetitions([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Container className="h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <PageHeader
        title="Petitions"
        subtitle="Browse, sign, and track petitions in your community"
        action={
          <Button onClick={() => navigate("/create")}>
            + Create Petition
          </Button>
        }
      />

      {/* TABS */}
      <div className="flex gap-8 border-b mt-2">
        {[
          { key: "all", label: "All Petitions", icon: FileText },
          { key: "mine", label: "My Petitions", icon: User },
          { key: "signed", label: "Signed by Me", icon: CheckCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = scope === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setScope(tab.key);
                setStatus("all"); // reset noise
              }}
              className={`flex items-center gap-2 pb-2 text-sm font-medium transition
                ${
                  active
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <CategoryFilter
          value={category}
          onChange={setCategory}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="under_review">Under Review</option>
          <option value="closed">Closed (Resolved)</option>
        </select>
      </div>

      {/* PETITION LIST (ONLY THIS SCROLLS) */}
      <div className="mt-6 flex-1 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-gray-500">Loading petitions...</p>
        ) : petitions.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No petitions found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {petitions.map((p) => (
              <PetitionCard
                key={p._id}
                _id={p._id}
                title={p.title}
                category={p.category}
                location={
                  p.location?.jurisdiction?.city ||
                  p.location?.address
                }
                current={p.signature_count}
                target={p.target_signatures}
                author={p.creator_name}
                status={p.status}
                has_signed={p.has_signed}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
