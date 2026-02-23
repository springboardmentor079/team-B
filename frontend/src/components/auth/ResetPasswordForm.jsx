import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPasswordForm() {
  const { token } = useParams(); // 🔥 THIS WAS MISSING
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        resetToken: token,      // 🔥 REQUIRED
        newPassword: password,  // 🔥 REQUIRED
      });

      setNotify({
        type: "success",
        title: "Password changed successfully",
        message: "You can now sign in with your new password.",
        actionLabel: "Go to Login",
        onAction: () => navigate("/auth"),
        autoCloseMs: 2500,
      });
    } catch (err) {
      setNotify({
        type: "error",
        title: "Password reset failed",
        message: err.response?.data?.message || "Please try again.",
        actionLabel: "OK",
      });
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          Reset Password
        </h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full border px-3 py-2 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-700 text-white py-2 rounded hover:bg-slate-800 transition"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

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
