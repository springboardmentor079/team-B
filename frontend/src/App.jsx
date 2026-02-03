import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Petitions from "./pages/Petitions";
import CreatePetition from "./pages/CreatePetition";
import AuthPage from "./pages/AuthPage";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
