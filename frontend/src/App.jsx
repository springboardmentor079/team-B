import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Petitions from "./pages/Petitions";
import CreatePetition from "./pages/CreatePetition";
import AuthPage from "./pages/AuthPage";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Polls from "./pages/Polls";
import CreatePoll from "./pages/CreatePoll";
import Officials from "./pages/Officials";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import VerificationStatus from "./pages/VerificationStatus";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Root (ONLY /) */}
        <Route
          index
          element={
            localStorage.getItem("token")
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/auth" replace />
          }
        />

        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordForm />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/petitions" element={<Petitions />} />
          <Route path="/create" element={<CreatePetition />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/polls/create" element={<CreatePoll />} />
          <Route path="/officials" element={<Officials />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/verification-status" element={<VerificationStatus />} />
          <Route path="/settings" element={<Settings />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}
