import { useForm } from "react-hook-form";
import { loginUser } from "../../services/authService";

export default function LoginForm({ onSuccess, onForgotPassword, onNotify }) {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (formData) => {
    try {
      const res = await loginUser(formData);

      const { token, user } = res.data;

      // ✅ Store correctly
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Pass correct data upward
      onSuccess({ token, user });
    } catch (error) {
      onNotify?.({
        type: "error",
        title: "Sign in failed",
        message: error.response?.data?.message || "Invalid email or password.",
        actionLabel: "Try Again",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...register("email", { required: true })}
        type="email"
        placeholder="Email"
        className="w-full border rounded px-3 py-2 text-sm sm:text-base"
      />

      <input
        {...register("password", { required: true })}
        type="password"
        placeholder="Password"
        className="w-full border rounded px-3 py-2 text-sm sm:text-base"
      />

      <button className="w-full bg-slate-700 text-white py-2 rounded text-sm sm:text-base hover:bg-slate-800 transition">
        Sign In
      </button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-cyan-700 text-center w-full"
      >
        Forgot password?
      </button>
    </form>
  );
}
