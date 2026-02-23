// src/services/petitionService.js
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

export const createPetition = (data) =>
  API.post("/petitions", data);

export const getPetitions = (params) =>
  API.get("/petitions", { params });

export const getLocalityPetitions = (params) =>
  API.get("/petitions/locality", { params });

export const respondToPetition = (petitionId, data) =>
  API.post(`/petitions/${petitionId}/respond`, data);

export const getLocalityOfficialsWithRemarks = () =>
  API.get("/petitions/locality-officials");
