import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // FULL viewport height + NO page scroll
    <div className="flex h-screen overflow-hidden bg-gray-50">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Right side */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar fixed */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Main content area (NO scroll here) */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto md:overflow-hidden">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
