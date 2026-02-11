export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}
