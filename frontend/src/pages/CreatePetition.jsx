import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function CreatePetition() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <PageHeader
          title="Create a New Petition"
          subtitle="Raise an issue and make your voice heard"
        />

        <Card className="mt-6">
          <form className="space-y-5">
            {/* Petition Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Petition Title
              </label>
              <input
                type="text"
                placeholder="Give your petition a clear, specific title"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400"
              />
            </div>

            {/* Category + Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  <option>Environment</option>
                  <option>Infrastructure</option>
                  <option>Education</option>
                  <option>Public Safety</option>
                  <option>Healthcare</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City (e.g., San Diego)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Signature Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signature Goal
              </label>
              <input
                type="number"
                placeholder="e.g. 100"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="4"
                placeholder="Describe the issue, why it matters, and what change you want"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary">Cancel</Button>
              <Button>Create Petition</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
