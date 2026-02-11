import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  requestSignupOTP,
  verifySignupOTP,
} from "../../services/authService";

export default function OTPSignupForm({ onSuccess, onNotify }) {
  const [step, setStep] = useState("form"); // form | otp
  const [emailForOTP, setEmailForOTP] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // STEP 1: Request OTP
  const handleSignup = async (data) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        location: {
          jurisdiction: {
            city: data.city,
            state: data.state,
            district: data.district,
          },
        },
      };

      await requestSignupOTP(payload);
      setEmailForOTP(data.email);
      setStep("otp");
      onNotify?.({
        type: "info",
        title: "OTP sent",
        message: `We sent a code to ${data.email}. Please enter it to continue.`,
        actionLabel: "OK",
        autoCloseMs: 2500,
      });
    } catch (err) {
      onNotify?.({
        type: "error",
        title: "Failed to send OTP",
        message: err.response?.data?.message || "Please try again.",
        actionLabel: "OK",
      });
    }
  };

  // STEP 2: Verify OTP
  const handleOTPVerify = async (data) => {
    try {
      await verifySignupOTP({
        email: emailForOTP,
        otp: data.otp,
      });
      onSuccess();
    } catch (err) {
      onNotify?.({
        type: "error",
        title: "Invalid OTP",
        message: err.response?.data?.message || "Please check and try again.",
        actionLabel: "OK",
      });
    }
  };

  return (
    <div className="space-y-6">
      {step === "form" ? (
        <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Create an account
          </h2>

          {/* Name */}
          <input
            {...register("name", { required: "Name is required" })}
            placeholder="Full Name"
            className="w-full border rounded-lg px-4 py-2 text-sm sm:text-base"
          />

          {/* Email */}
          <input
            {...register("email", { required: "Email is required" })}
            type="email"
            placeholder="Email Address"
            className="w-full border rounded-lg px-4 py-2 text-sm sm:text-base"
          />

          {/* Password */}
          <input
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-2 text-sm sm:text-base"
          />

          {/* Role */}
          <select
            {...register("role")}
            className="w-full border rounded-lg px-4 py-2 bg-white text-sm sm:text-base"
          >
            <option value="citizen">Citizen</option>
            <option value="official">Official</option>
          </select>

          {/* Location */}
          

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              {...register("city", { required: true })}
              placeholder="City"
              className="border rounded-lg px-3 py-2 text-sm sm:text-base"
            />
            <input
              {...register("district", { required: true })}
              placeholder="District"
              className="border rounded-lg px-3 py-2 text-sm sm:text-base"
            />
            <input
              {...register("state", { required: true })}
              placeholder="State"
              className="border rounded-lg px-3 py-2 text-sm sm:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm sm:text-base"
          >
            {isSubmitting ? "Sending OTP..." : "Sign Up"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit(handleOTPVerify)} className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Verify OTP
          </h2>

          <p className="text-sm text-gray-500">
            Enter the OTP sent to <strong>{emailForOTP}</strong>
          </p>

          <input
            {...register("otp", { required: true })}
            placeholder="Enter OTP"
            className="w-full border rounded-lg px-4 py-2 text-center tracking-widest text-sm sm:text-base"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm sm:text-base"
          >
            Verify OTP
          </button>
        </form>
      )}
    </div>
  );
}
