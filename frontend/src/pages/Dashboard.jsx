import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FileText, MapPin, CheckCircle } from "lucide-react";

import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import PetitionCard from "../components/PetitionCard";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH ON LOAD ---------------- */
  useEffect(() => {
    fetchPetitions();
    // eslint-disable-next-line
  }, []);

  const fetchPetitions = async () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      localStorage.clear();
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    const city =
      parsedUser?.location?.jurisdiction?.city ||
      parsedUser?.location?.address ||
      "all";

    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/petitions",
        {
          params: {
            location: city,
            status: "active", // ✅ dashboard only shows active
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPetitions(res.data.petitions || []);
    } catch (err) {
      console.error("Failed to fetch dashboard petitions", err);

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATS ---------------- */
  const myPetitionsCount = petitions.filter(
    (p) => p.creator_name === user?.name
  ).length;

  const successfulCount = petitions.filter(
    (p) => p.status === "closed"
  ).length;

  return (
    <Container className="h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <PageHeader
        title={`Welcome back, ${user?.name || ""}!`}
        subtitle="See what's happening in your community"
      />

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 shrink-0">

        {/* MY PETITIONS */}
        <Card
          className="cursor-pointer hover:shadow-md transition"
          onClick={() => navigate("/petitions?scope=mine")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">My Petitions</p>
              <p className="text-3xl font-bold">{myPetitionsCount}</p>
            </div>
          </div>
        </Card>

        {/* ACTIVE NEAR YOU */}
        <Card
          className="cursor-pointer hover:shadow-md transition"
          onClick={() => navigate("/petitions?status=active")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Active Petitions Near You
              </p>
              <p className="text-3xl font-bold">
                {petitions.length}
              </p>
            </div>
          </div>
        </Card>

        {/* SUCCESSFUL */}
        <Card
          className="cursor-pointer hover:shadow-md transition"
          onClick={() => navigate("/petitions?status=closed")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Successful Petitions
              </p>
              <p className="text-3xl font-bold">
                {successfulCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* PETITIONS LIST (ONLY THIS SCROLLS) */}
      <section className="mt-6 md:mt-8 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 shrink-0">
          Active Petitions Near You
        </h2>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <p className="text-gray-500">Loading petitions...</p>
          ) : petitions.length === 0 ? (
            <p className="text-gray-500">
              No petitions found in your area.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {petitions.map((p) => (
                <PetitionCard
                  key={p._id}
                  _id={p._id}
                  title={p.title}
                  category={p.category}
                  description={p.description}
                  location={
                    p.location?.jurisdiction?.city ||
                    p.location?.address ||
                    "Unknown"
                  }
                  current={p.signature_count || 0}
                  target={p.target_signatures || 1}
                  author={p.creator_name || "Anonymous"}
                  status={p.status}
                  has_signed={Boolean(p.has_signed)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}
