import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import PetitionCard from "../components/PetitionCard";

export default function Dashboard() {
  const petitions = [
    {
      title: "Improve Public Transportation System",
      category: "Transportation",
      location: "Sector 35, Chandigarh",
      current: 1234,
      target: 2000,
      author: "Rahul kumar",
      status: "active",
    },
    {
      title: "Build New Community Park",
      category: "Recreation",
      location: "Sector 65, Chandigarh",
      current: 1500,
      target: 1500,
      author: "Vikas Sharma",
      status: "successful",
    },
  ];

  return (
    <Container>
      <PageHeader
        title="Welcome back, Jatinjot!"
        subtitle="See what's happening in your community"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">My Petitions</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        <p className="text-xs text-gray-400 mt-1">petitions</p>
      </div>
      <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
        📄
      </div>
    </div>
  </Card>

  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Successful Petitions</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        <p className="text-xs text-gray-400 mt-1">completed</p>
      </div>
      <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xl">
        ✅
      </div>
    </div>
  </Card>

  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Polls Created</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        <p className="text-xs text-gray-400 mt-1">polls</p>
      </div>
      <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
        📊
      </div>
    </div>
  </Card>
</div>


      {/* Active Petitions */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Petitions Near You
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {petitions.map((petition, index) => (
            <PetitionCard key={index} {...petition} />
          ))}
        </div>
      </section>
    </Container>
  );
}
