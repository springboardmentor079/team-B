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

  useEffect(() => {
    fetchPetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const city = parsedUser?.location?.jurisdiction?.city || parsedUser?.location?.address || "all";

    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/petitions", {
        params: {
          location: city,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  const activePetitions = petitions.filter((p) => p.status === "active");
  const underReviewCount = petitions.filter((p) => p.status === "under_review").length;
  const completedCount = petitions.filter((p) => p.status === "completed").length;

  const myPetitionsCount = petitions.filter((p) => p.creator_name === user?.name).length;
  const successfulCount = petitions.filter((p) => p.status === "completed").length;

  return (
    <Container className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title={`Welcome back, ${user?.name || ""}!`}
        subtitle="See what's happening in your community"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 shrink-0">
        {user?.role === "official" ? (
          <>
            <Card
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => navigate("/petitions?status=active")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Petitions</p>
                  <p className="text-3xl font-bold">{activePetitions.length}</p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => navigate("/petitions?status=under_review")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Under Review</p>
                  <p className="text-3xl font-bold">{underReviewCount}</p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => navigate("/petitions?status=approved")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Petitions</p>
                  <p className="text-3xl font-bold">{completedCount}</p>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="cursor-pointer hover:shadow-md transition">
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

            <Card
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => navigate("/petitions?status=active")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Petitions Near You</p>
                  <p className="text-3xl font-bold">{activePetitions.length}</p>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => navigate("/petitions?status=approved")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Successful Petitions</p>
                  <p className="text-3xl font-bold">{successfulCount}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <section className="mt-6 md:mt-8 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 shrink-0">
          Active Petitions Near You
        </h2>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <p className="text-gray-500">Loading petitions...</p>
          ) : activePetitions.length === 0 ? (
            <p className="text-gray-500">No petitions found in your area.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {activePetitions.map((p) => (
                <PetitionCard
                  key={p._id}
                  _id={p._id}
                  title={p.title}
                  category={p.category}
                  description={p.description}
                  location={p.location?.jurisdiction?.city || p.location?.address || "Unknown"}
                  current={p.signature_count || 0}
                  target={p.target_signatures || 1}
                  author={p.creator_name || "Anonymous"}
                  status={p.status}
                  has_signed={Boolean(p.has_signed)}
                  userRole={user?.role || "citizen"}
                  verificationStatus={user?.verificationStatus || "unverified"}
                  onPetitionUpdated={fetchPetitions}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}
