import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Vote, ShieldCheck, MapPin } from "lucide-react";

import LoginForm from "../components/auth/LoginForm";
import OTPSignupForm from "../components/auth/OTPSignupForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

export default function AuthPage() {
  const [activeView, setActiveView] = useState("login");
  const [notify, setNotify] = useState(null);
  const navigate = useNavigate();

  const handleLoginSuccess = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setNotify({
      type: "success",
      title: "Signed in successfully",
      message: "Welcome back! You are now logged in.",
      actionLabel: "Continue",
      onAction: () => navigate("/dashboard"),
      autoCloseMs: 2500,
    });
  };

  const handleSignupSuccess = () => {
    setNotify({
      type: "success",
      title: "Signup successful",
      message: "Your account is ready. Please sign in to continue.",
      actionLabel: "Go to Sign In",
      onAction: () => setActiveView("login"),
      autoCloseMs: 2500,
    });
  };

  const handleNotify = (payload) => {
    setNotify(payload);
  };

  useEffect(() => {
    if (!notify?.autoCloseMs) return;

    const timer = setTimeout(() => {
      const action = notify.onAction;
      setNotify(null);
      action?.();
    }, notify.autoCloseMs);

    return () => clearTimeout(timer);
  }, [notify]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-500 via-slate-600 to-cyan-700 flex items-center justify-center px-4 py-6">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-center p-10 text-white bg-gradient-to-br from-slate-700 to-cyan-800">
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
        <div className="p-6 sm:p-8 flex flex-col justify-center">

          {/* Tabs */}
          {activeView !== "forgot" && (
            <div className="flex mb-6 border-b">
              <button
                onClick={() => setActiveView("login")}
                className={`flex-1 py-2 font-semibold text-sm sm:text-base ${
                  activeView === "login"
                    ? "border-b-2 border-cyan-700 text-cyan-700"
                    : "text-gray-500"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveView("signup")}
                className={`flex-1 py-2 font-semibold text-sm sm:text-base ${
                  activeView === "signup"
                    ? "border-b-2 border-cyan-700 text-cyan-700"
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
              onNotify={handleNotify}
            />
          )}

          {activeView === "signup" && (
            <OTPSignupForm
              onSuccess={handleSignupSuccess}
              onNotify={handleNotify}
            />
          )}

          {activeView === "forgot" && (
            <ForgotPasswordForm
              onBackToLogin={() => setActiveView("login")}
              onNotify={handleNotify}
            />
          )}

        </div>
      </div>

      {/* Notification Modal */}
      {notify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center">
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-semibold ${
                notify.type === "error"
                  ? "bg-red-50 text-red-600"
                  : notify.type === "info"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {notify.type === "error" ? "!" : "✓"}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {notify.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {notify.message}
            </p>
            <button
              onClick={() => {
                const action = notify.onAction;
                setNotify(null);
                action?.();
              }}
              className={`mt-6 w-full px-4 py-2.5 rounded-lg text-white text-sm font-medium transition ${
                notify.type === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : notify.type === "info"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {notify.actionLabel || "OK"}
            </button>
          </div>
        </div>
      )}
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
