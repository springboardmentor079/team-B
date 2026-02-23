import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const loginUser = (data) =>
  axios.post(`${API}/api/auth/login`, data);

export const requestSignupOTP = (data) =>
  axios.post(`${API}/api/auth/request-registration-otp`, data);

export const verifySignupOTP = (data) =>
  axios.post(`${API}/api/auth/verify-registration-otp`, data);

export const requestPasswordReset = (email) =>
  axios.post(`${API}/api/auth/request-password-reset`, { email });

export const resetPassword = (payload) =>
  axios.post(`${API}/api/auth/reset-password`, payload);

export const getProfile = (token) =>
  axios.get(`${API}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateProfile = (token, data) =>
  axios.put(`${API}/api/auth/profile`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
