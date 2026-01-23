import { Bell, ChevronDown } from "lucide-react";

export default function Topbar() {
  return (
    <header
      className="
        h-16 bg-white border-b border-gray-200
        flex items-center justify-between
        px-6 shadow-sm
      "
    >
      {/* Left: Brand / Page Title */}
      <div className="flex items-center gap-3">
        
        <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
          Civix
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="
            relative p-2 rounded-lg
            text-gray-600 hover:text-gray-900
            hover:bg-gray-100 transition
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* User Menu */}
        <div
          className="
            flex items-center gap-3
            px-3 py-2 rounded-lg
            cursor-pointer
            hover:bg-gray-100 transition
          "
        >
          {/* Avatar */}
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
            S
          </div>

          {/* Name */}
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-medium text-gray-800">
              Jatinjot
            </span>
            <span className="text-xs text-gray-500">
              Citizen
            </span>
          </div>

          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
}
