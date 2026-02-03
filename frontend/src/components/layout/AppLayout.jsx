import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

export default function AppLayout() {
  return (
    // FULL viewport height + NO page scroll
    <div className="flex h-screen overflow-hidden bg-gray-50">

      <Sidebar />

      {/* Right side */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar fixed */}
        <Topbar />

        {/* Main content area (NO scroll here) */}
        <main className="flex-1 p-6 overflow-hidden">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
