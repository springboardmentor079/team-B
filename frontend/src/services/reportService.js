import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getMonthlyReport = (params) =>
  API.get("/reports/monthly/export", { params });

export const exportMonthlyReportCsv = (params) =>
  API.get("/reports/monthly/export", {
    params: { ...params, format: "csv" },
    responseType: "blob",
  });

export const getPetitionStatusMonthly = (params) =>
  API.get("/reports/petitions/status-monthly", { params });
