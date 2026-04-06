import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||         
      localStorage.getItem("hospitalToken") ||
      localStorage.getItem("vendorToken") ||
      localStorage.getItem("doctorToken") ||
      localStorage.getItem("manufacturerToken") ||
      localStorage.getItem("franchiseToken") ||
      localStorage.getItem("pharmacyToken") ||
      null;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
