import { useForm } from "react-hook-form";
import { loginUser } from "../../services/authService";

export default function LoginForm({ onSuccess, onForgotPassword }) {
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
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...register("email", { required: true })}
        type="email"
        placeholder="Email"
        className="w-full border rounded px-3 py-2"
      />

      <input
        {...register("password", { required: true })}
        type="password"
        placeholder="Password"
        className="w-full border rounded px-3 py-2"
      />

      <button className="w-full bg-indigo-600 text-white py-2 rounded">
        Sign In
      </button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-indigo-600 text-center w-full"
      >
        Forgot password?
      </button>
    </form>
  );
}
