import { useEffect, useState } from "react";
import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { getLocalityOfficialsWithRemarks } from "../services/petitionService";

export default function Officials() {
  const [officials, setOfficials] = useState([]);
  const [locality, setLocality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLocalityOfficials();
  }, []);

  const fetchLocalityOfficials = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getLocalityOfficialsWithRemarks();
      setOfficials(res.data?.officials || []);
      setLocality(res.data?.locality || null);
    } catch (err) {
      console.error("Failed to fetch locality officials", err);
      setOfficials([]);
      setError(err.response?.data?.message || "Failed to load locality officials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="h-full flex flex-col gap-4 overflow-y-auto">
      <PageHeader
        title="Officials"
        subtitle="Officials in your area and their remarks on local petitions."
      />

      {locality ? (
        <Card className="text-sm">
          <span className="text-gray-500">Your area: </span>
          <span className="font-semibold">
            {locality.city || "Unknown city"}
            {locality.state ? `, ${locality.state}` : ""}
          </span>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Local Officials</h2>

        {loading ? <p className="text-sm text-gray-500">Loading officials...</p> : null}
        {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && officials.length === 0 ? (
          <p className="text-sm text-gray-500">No officials found in your area.</p>
        ) : null}

        {!loading && !error && officials.length > 0 ? (
          <div className="space-y-4">
            {officials.map((official) => (
              <Card key={official.id} className="border border-gray-200 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{official.name}</h3>
                  <p className="text-sm text-gray-600">{official.email}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Remarks on petitions</p>
                  {official.remarks?.length ? (
                    <div className="mt-2 space-y-2">
                      {official.remarks.map((remark, index) => (
                        <div
                          key={`${official.id}-${index}`}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                        >
                          <p className="text-xs text-gray-500">
                            {remark.petitionTitle} - {remark.statusAfterUpdate}
                          </p>
                          <p className="text-sm text-gray-800 mt-1">{remark.comment}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {remark.createdAt ? new Date(remark.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No remarks yet.</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </Card>
    </Container>
  );
}
