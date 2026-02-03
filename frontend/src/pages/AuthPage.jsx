import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Vote, ShieldCheck, MapPin } from "lucide-react";

import LoginForm from "../components/auth/LoginForm";
import OTPSignupForm from "../components/auth/OTPSignupForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

export default function AuthPage() {
  const [activeView, setActiveView] = useState("login");
  const navigate = useNavigate();

  const handleLoginSuccess = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-center p-10 text-white bg-gradient-to-br from-indigo-600 to-purple-700">
          <h1 className="text-4xl font-bold mb-4">Welcome to Civix</h1>
          <p className="text-lg opacity-90 mb-8">
            Your Digital Platform for Civic Engagement
          </p>

          <div className="space-y-6">
            <Feature icon={<Vote />} title="Participate in Democracy">
              Create and sign petitions, participate in polls.
            </Feature>

            <Feature icon={<ShieldCheck />} title="Verified Officials">
              Officials can verify identity for credibility.
            </Feature>

            <Feature icon={<MapPin />} title="Location-Based Content">
              See issues relevant to your local area.
            </Feature>
          </div>
        </div>

        {/* Right panel */}
        <div className="p-8 flex flex-col justify-center">

          {/* Tabs */}
          {activeView !== "forgot" && (
            <div className="flex mb-6 border-b">
              <button
                onClick={() => setActiveView("login")}
                className={`flex-1 py-2 font-semibold ${
                  activeView === "login"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveView("signup")}
                className={`flex-1 py-2 font-semibold ${
                  activeView === "signup"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Forms */}
          {activeView === "login" && (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onForgotPassword={() => setActiveView("forgot")}
            />
          )}

          {activeView === "signup" && (
            <OTPSignupForm onSuccess={() => setActiveView("login")} />
          )}

          {activeView === "forgot" && (
            <ForgotPasswordForm
              onBackToLogin={() => setActiveView("login")}
            />
          )}

        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, children }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm opacity-90">{children}</p>
      </div>
    </div>
  );
}
