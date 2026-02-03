import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { createPetition } from "../services/petitionService";

export default function CreatePetition() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm();

  const navigate = useNavigate();

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

      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create petition");
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <PageHeader
          title="Create a New Petition"
          subtitle="Raise an issue and make your voice heard"
        />

        <Card className="mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Petition Title
              </label>
              <input
                {...register("title", { required: true })}
                className="w-full border rounded px-4 py-2"
                placeholder="Give your petition a clear title"
              />
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
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Petition"}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </div>
  );
}
