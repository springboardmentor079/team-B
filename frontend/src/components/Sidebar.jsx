import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  PieChart,
  ShieldCheck,
  Settings,
  LogOut
} from "lucide-react";

export default function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;

    try {
      const parsed = JSON.parse(rawUser);
      setUserRole(parsed?.role || "");
    } catch (error) {
      console.error("Invalid user in localStorage", error);
      setUserRole("");
    }
  }, []);

  const navItems = useMemo(() => {
    const items = [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Petitions", path: "/petitions", icon: FileText },
      { name: "Polls", path: "/polls", icon: BarChart3 },
      userRole === "official"
        ? { name: "Reports", path: "/reports", icon: PieChart }
        : { name: "Officials", path: "/officials", icon: Users },
    ];

    if (userRole === "official") {
      items.push({ name: "Verification Status", path: "/verification-status", icon: ShieldCheck });
    }

    items.push({ name: "Settings", path: "/settings", icon: Settings });
    return items;
  }, [userRole]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
          C
        </div>
        <span className="ml-3 text-lg font-semibold text-gray-800">
          Civix
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition
              ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon size={18} />
            {name}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      </aside>

      {/* Logout Confirm Modal (portal-like, outside transformed sidebar) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6">
            <div className="text-center">
              <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center font-semibold">
                !
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-gray-900">
                Are you sure you want to logout?
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You will need to sign in again to continue.
              </p>
            </div>

            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                No, Stay
              </button>
              <button
                onClick={handleLogout}
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
