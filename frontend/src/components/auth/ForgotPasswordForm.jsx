import { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "../../services/authService";

export default function ForgotPasswordForm({ onBackToLogin, onNotify }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");

    try {
      await requestPasswordReset(data.email);
      onNotify?.({
        type: "success",
        title: "Reset link sent",
        message: "Check your email for the password reset link.",
        actionLabel: "Back to Login",
        onAction: () => onBackToLogin(),
        autoCloseMs: 2500,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to request password reset. Please try again.";
      setError(message);
      onNotify?.({
        type: "error",
        title: "Reset failed",
        message,
        actionLabel: "OK",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- FORM STATE ---------------- */
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 mb-2">
        Forgot password?
      </h2>
      <p className="text-sm text-center text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <div className="flex items-center border rounded-lg px-3">
            <Mail size={18} className="text-gray-500" />
            <input
              type="email"
              placeholder="Email address"
              disabled={isLoading}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Please enter a valid email",
                },
              })}
              className="w-full px-2 py-2 outline-none disabled:bg-gray-100"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-700 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-60"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {/* Back to login */}
      <button
        onClick={onBackToLogin}
        className="mt-6 flex items-center justify-center gap-2 text-sm text-cyan-700 hover:underline w-full"
      >
        <ArrowLeft size={16} />
        Back to login
      </button>
    </div>
  );
}
