import axios from "axios";
import { API_URL } from "../../config/api";

const API = axios.create({
  baseURL: `${API_URL}/delivery`,
});

// attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("deliveryToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const deliveryAgentRegister = (data) => API.post("/register", data);
export const deliveryAgentLogin = (data) => API.post("/login", data);

// ✅ FIXED
export const getDeliveryAgentProfile = () => API.get("/profile");
export const getDeliveryAgentDashboard = () => API.get("/dashboard");
