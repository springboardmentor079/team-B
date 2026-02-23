import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getPetitionStatusMonthly } from "../services/reportService";

const statusOrder = ["active", "under_review", "completed", "closed"];
const statusColors = {
  active: "#2563eb",
  under_review: "#f59e0b",
  completed: "#10b981",
  closed: "#6b7280",
};

const labelFor = {
  active: "Active",
  under_review: "Under Review",
  completed: "Completed",
  closed: "Closed",
};

export default function Reports() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [locality, setLocality] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      setUser(JSON.parse(raw));
    } catch (err) {
      console.error("Invalid user in localStorage", err);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "official") {
      setLoading(false);
      return;
    }

    fetchStatusMonthly();
  }, [user]);

  const fetchStatusMonthly = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPetitionStatusMonthly({ months: 12 });
      const list = res.data?.months || [];
      setMonths(list);
      setLocality(res.data?.locality || null);
      if (list.length) {
        setSelectedMonthKey(list[list.length - 1].key);
      }
    } catch (err) {
      console.error("Failed to fetch monthly report data", err);
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const selectedMonth = useMemo(
    () => months.find((m) => m.key === selectedMonthKey) || null,
    [months, selectedMonthKey]
  );

  const total = useMemo(() => {
    if (!selectedMonth) return 0;
    return statusOrder.reduce(
      (sum, key) => sum + (selectedMonth.byStatus?.[key] || 0),
      0
    );
  }, [selectedMonth]);

  const chartStops = useMemo(() => {
    if (!selectedMonth || total === 0) return "#e5e7eb 0% 100%";
    let current = 0;
    const stops = [];
    for (const status of statusOrder) {
      const value = selectedMonth.byStatus?.[status] || 0;
      const pct = (value / total) * 100;
      const start = current;
      current += pct;
      stops.push(`${statusColors[status]} ${start}% ${current}%`);
    }
    return stops.join(", ");
  }, [selectedMonth, total]);

  const exportPdf = () => {
    if (!selectedMonth) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 16;
    let y = 20;

    doc.setFontSize(18);
    doc.text("Civix Petition Status Report", left, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text("Monthly distribution report for petition statuses.", left, y);
    y += 10;

    doc.setTextColor(17, 24, 39);
    doc.text(`Month: ${selectedMonth.monthLabel}`, left, y);
    y += 7;
    doc.text(`Locality: ${locality || "All"}`, left, y);
    y += 7;
    doc.text(`Total Petitions: ${total}`, left, y);
    y += 10;

    const colStatus = left;
    const colCount = pageWidth * 0.6;
    const colPercent = pageWidth * 0.78;

    doc.setFont(undefined, "bold");
    doc.text("Status", colStatus, y);
    doc.text("Count", colCount, y);
    doc.text("Percentage", colPercent, y);
    y += 3;
    doc.line(left, y, pageWidth - left, y);
    y += 8;

    doc.setFont(undefined, "normal");
    statusOrder.forEach((status) => {
      const value = selectedMonth.byStatus?.[status] || 0;
      const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
      doc.text(labelFor[status], colStatus, y);
      doc.text(String(value), colCount, y);
      doc.text(`${pct}%`, colPercent, y);
      y += 8;
    });

    const fileName = `civic-report-${selectedMonth.key}.pdf`;
    doc.save(fileName);
  };

  if (user && user.role !== "official") {
    return (
      <Container>
        <PageHeader
          title="Reports"
          subtitle="Reports are available for official accounts only."
        />
      </Container>
    );
  }

  return (
    <Container className="h-full flex flex-col gap-4 overflow-y-auto">
      <PageHeader
        title="Reports"
        subtitle="Monthly petition status distribution for your locality."
      />

      {locality ? (
        <Card className="text-sm">
          <span className="text-gray-500">Locality: </span>
          <span className="font-semibold">{locality}</span>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold">Petitions By Status</h2>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              disabled={!months.length}
            >
              {months.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.monthLabel}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={exportPdf} disabled={!selectedMonth}>
              Export PDF
            </Button>
          </div>
        </div>

        {loading ? <p className="text-sm text-gray-500">Loading reports...</p> : null}
        {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error && !selectedMonth ? (
          <p className="text-sm text-gray-500">No report data available.</p>
        ) : null}

        {!loading && !error && selectedMonth ? (
          <div className="grid gap-6 md:grid-cols-[240px,1fr] md:items-center">
            <div className="mx-auto w-56 flex flex-col items-center">
              <div
                className="h-56 w-56 rounded-full border-8 border-white shadow-inner"
                style={{ background: `conic-gradient(${chartStops})` }}
              />
              <p className="text-center text-sm text-gray-500 mt-3">
                Total: <span className="font-semibold text-gray-800">{total}</span>
              </p>
            </div>

            <div className="space-y-3">
              {statusOrder.map((status) => {
                const value = selectedMonth.byStatus?.[status] || 0;
                const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={status} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: statusColors[status] }}
                        />
                        <span>{labelFor[status]}</span>
                      </div>
                      <span className="text-gray-500">
                        {value} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Card>
    </Container>
  );
}
