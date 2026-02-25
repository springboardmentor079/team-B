import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getMyNotifications = (limit = 10) =>
  axios.get(`${API}/api/notifications`, {
    params: { limit },
    headers: authHeaders(),
  });

export const markAllNotificationsRead = () =>
  axios.patch(
    `${API}/api/notifications/read-all`,
    {},
    {
      headers: authHeaders(),
    }
  );
