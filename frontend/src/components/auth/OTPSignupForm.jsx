import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  requestSignupOTP,
  verifySignupOTP,
} from "../../services/authService";

export default function OTPSignupForm({ onSuccess }) {
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
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    }
  };

  // STEP 2: Verify OTP
  const handleOTPVerify = async (data) => {
    try {
      await verifySignupOTP({
        email: emailForOTP,
        otp: data.otp,
      });
      alert("Signup successful! Please login.");
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="space-y-6">
      {step === "form" ? (
        <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Create an account
          </h2>

          {/* Name */}
          <input
            {...register("name", { required: "Name is required" })}
            placeholder="Full Name"
            className="w-full border rounded-lg px-4 py-2"
          />

          {/* Email */}
          <input
            {...register("email", { required: "Email is required" })}
            type="email"
            placeholder="Email Address"
            className="w-full border rounded-lg px-4 py-2"
          />

          {/* Password */}
          <input
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-2"
          />

          {/* Role */}
          <select
            {...register("role")}
            className="w-full border rounded-lg px-4 py-2 bg-white"
          >
            <option value="citizen">Citizen</option>
            <option value="official">Official</option>
          </select>

          {/* Location */}
          

          <div className="grid grid-cols-3 gap-3">
            <input
              {...register("city", { required: true })}
              placeholder="City"
              className="border rounded-lg px-3 py-2"
            />
            <input
              {...register("district", { required: true })}
              placeholder="District"
              className="border rounded-lg px-3 py-2"
            />
            <input
              {...register("state", { required: true })}
              placeholder="State"
              className="border rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg"
          >
            {isSubmitting ? "Sending OTP..." : "Sign Up"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit(handleOTPVerify)} className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Verify OTP
          </h2>

          <p className="text-sm text-gray-500">
            Enter the OTP sent to <strong>{emailForOTP}</strong>
          </p>

          <input
            {...register("otp", { required: true })}
            placeholder="Enter OTP"
            className="w-full border rounded-lg px-4 py-2 text-center tracking-widest"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-2 rounded-lg"
          >
            Verify OTP
          </button>
        </form>
      )}
    </div>
  );
}
