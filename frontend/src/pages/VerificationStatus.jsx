import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const API = "http://localhost:5000";

const formatStatusLabel = (value = "") =>
  value
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function VerificationStatus() {
  const [user, setUser] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      setUser(JSON.parse(raw));
    } catch (error) {
      console.error("Failed to parse user", error);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, []);

  const syncLocalUserStatus = (verificationStatus) => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...parsed,
          verificationStatus,
        })
      );
      window.dispatchEvent(new Event("user-updated"));
      setUser((prev) => (prev ? { ...prev, verificationStatus } : prev));
    } catch (error) {
      console.error("Failed to sync local user status", error);
    }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API}/api/verification/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatusData(res.data);
      const latestStatus = res.data?.user?.verificationStatus;
      if (latestStatus) {
        syncLocalUserStatus(latestStatus);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch verification status.",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = useMemo(
    () => statusData?.user?.verificationStatus || user?.verificationStatus || "unverified",
    [statusData, user]
  );

  const submitRequest = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a Government ID file first." });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: "", text: "" });

      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("documents", file);
      formData.append("documentTypes", JSON.stringify(["government_id"]));

      const endpoint = currentStatus === "rejected" ? "resubmit" : "submit";
      await axios.post(`${API}/api/verification/${endpoint}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({
        type: "success",
        text: "Verification request submitted successfully. Please wait for admin approval.",
      });
      setFile(null);
      await fetchStatus();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to submit verification request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== "official") {
    return (
      <Container className="h-full flex flex-col gap-4 overflow-y-auto">
        <PageHeader title="Verification Status" subtitle="Only official accounts can access this page." />
        <Card className="text-sm text-gray-600">This feature is available only for official users.</Card>
      </Container>
    );
  }

  return (
    <Container className="h-full flex flex-col gap-4 overflow-y-auto">
      <PageHeader
        title="Verification Status"
        subtitle="Submit your Government ID to unlock official actions."
      />

      {message.text ? (
        <Card
          className={`text-sm ${
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {message.text}
        </Card>
      ) : null}

      <Card>
        {loading ? (
          <p className="text-sm text-gray-500">Loading verification status...</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Current Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatStatusLabel(currentStatus)}
              </p>
              {currentStatus === "verified" ? (
                <p className="text-sm text-emerald-700">
                  Your account is verified. You can now perform official actions.
                </p>
              ) : currentStatus === "pending" ? (
                <p className="text-sm text-amber-700">
                  Your verification is pending admin review.
                </p>
              ) : currentStatus === "rejected" ? (
                <p className="text-sm text-red-700">
                  Your previous request was rejected. Please upload a valid document and resubmit.
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Submit your Government ID to start verification.
                </p>
              )}
            </div>

            {currentStatus !== "verified" && currentStatus !== "pending" ? (
              <div className="space-y-3 border-t pt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Government ID (JPG, PNG, PDF, TIFF)
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.tiff,.tif"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700"
                />
                <div className="pt-1">
                  <Button onClick={submitRequest} disabled={submitting}>
                    {submitting ? "Submitting..." : currentStatus === "rejected" ? "Resubmit for Verification" : "Submit for Verification"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {statusData?.documents?.length ? (
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Submitted Documents</h3>
          <div className="space-y-2">
            {statusData.documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-900">{doc.metadata?.originalName || "Document"}</p>
                <p className="text-gray-600">Type: {formatStatusLabel(doc.documentType || "government_id")}</p>
                <p className="text-gray-600">Status: {formatStatusLabel(doc.status || "pending")}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </Container>
  );
}
