import { Bell, ChevronDown, MapPin, Menu, Mail, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Topbar({ onMenuClick }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Open navigation menu"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
          Civix
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 relative" ref={menuRef}>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* User */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          
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
        </button>

        {open && (
          <div className="absolute right-0 top-14 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {user?.role || "role"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 text-gray-400" />
                <span className="break-all">
                  {user?.email || "No email"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Shield size={16} className="mt-0.5 text-gray-400" />
                <span className="capitalize">
                  {user?.verificationStatus || "unverified"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-gray-400" />
                <span>
                  {user?.location?.jurisdiction?.city ||
                    user?.location?.address ||
                    "Location not set"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
