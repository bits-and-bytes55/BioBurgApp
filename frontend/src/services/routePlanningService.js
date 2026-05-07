import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/route-planning`,
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getRouteByDate = async (date) => {
  const res = await API.get(`/${date}`);
  return res.data;
};

export const saveRoutePlan = async (payload) => {
  const res = await API.post("/upsert", payload);
  return res.data;
};

export const updateRouteStopStatus = async (
  date,
  stopId,
  payload
) => {
  const res = await API.patch(
    `/${date}/stop/${stopId}/status`,
    payload
  );

  return res.data;
};

export const deleteRouteStop = async (date, stopId) => {
  const res = await API.delete(`/${date}/stop/${stopId}`);
  return res.data;
};

export const getRouteHistory = async () => {
  const res = await API.get("/history");
  return res.data;
};