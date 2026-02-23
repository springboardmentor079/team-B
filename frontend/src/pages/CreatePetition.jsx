import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { createPetition } from "../services/petitionService";

export default function CreatePetition() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();

  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [userRole, setUserRole] = useState("");
  const titleValue = watch("title", "");
  const titleWordCount = titleValue.trim() ? titleValue.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    try {
      const parsed = JSON.parse(rawUser);
      setUserRole(parsed?.role || "");
    } catch (error) {
      console.error("Failed to parse user", error);
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      await createPetition({
        title: data.title,
        category: data.category,
        description: data.description,
        target_signatures: Number(data.target_signatures),

        // ✅ SEND CITY AS STRING
        location: data.location.trim()
      });

      setShowSuccess(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create petition");
    }
  };

  return (
    <div className="h-full flex items-start sm:items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl">
        {userRole && userRole !== "citizen" ? (
          <Card className="mt-6 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
            <p className="text-sm text-gray-600 mt-2">
              Only citizens can create petitions.
            </p>
            <div className="mt-4">
              <Button onClick={() => navigate("/petitions")}>Back to Petitions</Button>
            </div>
          </Card>
        ) : null}

        {userRole && userRole !== "citizen" ? null : (
        <>
        <PageHeader
          title="Create a New Petition"
          subtitle="Raise an issue and make your voice heard"
        />

        <Card className="mt-6 p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Petition Title
              </label>
              <input
                {...register("title", {
                  required: "Title is required",
                  validate: (value) =>
                    (value.trim() ? value.trim().split(/\s+/).length : 0) <= 12 ||
                    "Title must not exceed 12 words",
                })}
                className="w-full border rounded px-4 py-2"
                placeholder="Give your petition a clear title"
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={errors.title ? "text-red-600" : "text-gray-500"}>
                  {errors.title?.message || "Maximum 12 words"}
                </span>
                <span className={titleWordCount > 12 ? "text-red-600" : "text-gray-500"}>
                  {titleWordCount}/12 words
                </span>
              </div>
            </div>

            {/* Category + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  {...register("category", { required: true })}
                  className="w-full border rounded px-4 py-2 bg-white"
                >
                  <option value="">Select category</option>
                  <option value="Environment">Environment</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Education">Education</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  City
                </label>
                <input
                  {...register("location", { required: true })}
                  className="w-full border rounded px-4 py-2"
                  placeholder="City (e.g., Patiala)"
                />
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Signature Goal
              </label>
              <input
                {...register("target_signatures", { required: true })}
                type="number"
                className="w-full border rounded px-4 py-2"
                placeholder="e.g. 100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                {...register("description", { required: true })}
                rows={4}
                className="w-full border rounded px-4 py-2 resize-none"
                placeholder="Describe the issue"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Creating..." : "Create Petition"}
              </Button>
            </div>

          </form>
        </Card>
        </>
        )}
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center font-semibold">
              ✓
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Petition created successfully
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your petition has been submitted and will appear shortly.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                navigate("/dashboard");
              }}
              className="mt-6 w-full px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
