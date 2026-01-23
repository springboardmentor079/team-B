import { useNavigate } from "react-router-dom";

import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import PetitionCard from "../components/PetitionCard";
import CategoryFilter from "../components/CategoryFilter";

export default function Petitions() {
  const navigate = useNavigate();

  // Temporary dummy data (later comes from backend)
  const petitions = [
    {
      id: 1,
      title: "Fix road near main market",
      category: "Infrastructure",
      location: "Sector 34",
      status: "Active",
    },
    {
      id: 2,
      title: "Increase green parks",
      category: "Environment",
      location: "sector 37",
      status: "Under Review",
    },
  ];

  return (
    <Container>
      {/* Page Header */}
      <PageHeader
        title="Petitions"
        subtitle="Browse and manage petitions in your community"
        action={
          <Button onClick={() => navigate("/create")}>
            + Create Petition
          </Button>
        }
      />

      {/* Category Filters */}
      <CategoryFilter />

      {/* Petition Cards */}
      {petitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {petitions.map((petition) => (
            <PetitionCard key={petition.id} petition={petition} />
          ))}
        </div>
      ) : (
        <div className="mt-10 text-center text-gray-500">
          No petitions found.
        </div>
      )}
    </Container>
  );
}
