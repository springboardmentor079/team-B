import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPasswordForm() {
  const { token } = useParams(); // 🔥 THIS WAS MISSING
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        resetToken: token,      // 🔥 REQUIRED
        newPassword: password,  // 🔥 REQUIRED
      });

      alert("Password reset successful. Please login.");
      navigate("/auth");
    } catch (err) {
      alert(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
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
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
