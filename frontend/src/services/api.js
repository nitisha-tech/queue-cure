
// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AUTH
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);

// ADMIN
export const getPendingReceptionists = () => API.get("/admin/pending");
export const approveReceptionist = (id) => API.patch(`/admin/approve/${id}`);
export const rejectReceptionist = (id) => API.delete(`/admin/reject/${id}`);

// RECEPTIONIST
export const getPendingPatients = () => API.get("/queue/pending");
export const acceptPatient = (id) => API.patch(`/queue/accept/${id}`);
export const rejectPatient = (id) => API.patch(`/queue/reject/${id}`);
export const callNext = () => API.patch("/queue/call-next");
export const setAvgTime = (minutes) => API.patch("/queue/avg-time", { minutes });
export const getQueueState = () => API.get("/queue/state");

// PATIENT
export const joinQueue = (data) => API.post("/queue/join", data);
export const getMyQueueStatus = () => API.get("/queue/my-status");
export const getAdminActivityLog = () => API.get("/admin/activity-log");