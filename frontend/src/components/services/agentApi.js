import axios from "axios";
import { API_URL } from "../../config/api";

const API = axios.create({
  baseURL: `${API_URL}/agent`,
  timeout: 30000,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("agentToken");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const agentLogin = (data) => API.post("/login", data);
export const agentRegister = (data) => API.post("/register", data);
export const getAgentProfile = () => API.get("/profile");
export const getAgentProfileWithJob = () => API.get("/profile-with-job");
export const getMyIdCard = () => API.get("/my-id-card");

export default API;