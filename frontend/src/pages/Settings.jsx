import { useEffect, useState } from "react";
import Container from "../components/ui/Container";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getProfile, updateProfile } from "../services/authService";

const prettyDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    district: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await getProfile(token);
      const user = res.data?.user;
      setProfile(user);
      setForm({
        name: user?.name || "",
        city: user?.location?.jurisdiction?.city || "",
        state: user?.location?.jurisdiction?.state || "",
        district: user?.location?.jurisdiction?.district || "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const onFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      const token = localStorage.getItem("token");
      if (!token) return;

      const payload = {
        name: form.name.trim(),
        location: {
          address: profile?.location?.address || "",
          jurisdiction: {
            city: form.city.trim(),
            state: form.state.trim(),
            district: form.district.trim(),
          },
        },
      };

      const res = await updateProfile(token, payload);
      const updatedUser = res.data?.user;
      setProfile(updatedUser);

      const localUserRaw = localStorage.getItem("user");
      if (localUserRaw) {
        const localUser = JSON.parse(localUserRaw);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...localUser,
            name: updatedUser?.name || localUser.name,
            location: updatedUser?.location || localUser.location,
          })
        );
      }

      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="h-full flex flex-col gap-4 overflow-y-auto">
      <PageHeader
        title="Settings"
        subtitle="View your account details and update your profile information."
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading details...</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">User ID:</span> {profile?._id || "-"}</p>
              <p><span className="text-gray-500">Name:</span> {profile?.name || "-"}</p>
              <p><span className="text-gray-500">Email:</span> {profile?.email || "-"}</p>
              <p><span className="text-gray-500">Role:</span> <span className="capitalize">{profile?.role || "-"}</span></p>
              <p><span className="text-gray-500">Verification Status:</span> <span className="capitalize">{profile?.verificationStatus || "-"}</span></p>
              <p><span className="text-gray-500">Email Verified:</span> {profile?.emailVerified ? "Yes" : "No"}</p>
              <p><span className="text-gray-500">City:</span> {profile?.location?.jurisdiction?.city || "-"}</p>
              <p><span className="text-gray-500">State:</span> {profile?.location?.jurisdiction?.state || "-"}</p>
              <p><span className="text-gray-500">District:</span> {profile?.location?.jurisdiction?.district || "-"}</p>
              <p><span className="text-gray-500">Created At:</span> {prettyDate(profile?.createdAt)}</p>
              <p><span className="text-gray-500">Updated At:</span> {prettyDate(profile?.updatedAt)}</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Details</h2>
          <form className="space-y-3" onSubmit={onSave}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onFieldChange("name", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => onFieldChange("city", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => onFieldChange("state", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">District</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => onFieldChange("district", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}
