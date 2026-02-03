import { Bell, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function Topbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return;

    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Invalid user data in localStorage");
      localStorage.removeItem("user");
    }
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      
      {/* Left */}
      <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
        Civix
      </h1>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          
          {/* Avatar */}
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          {/* Name + Role */}
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-medium text-gray-800">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {user?.role || "role"}
            </span>
          </div>

          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
}
