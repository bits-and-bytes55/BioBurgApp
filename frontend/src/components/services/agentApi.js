import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api/agent",
  // baseURL: import.meta.env.VITE_API_BASE_URL + "/api/agent",
});



API.interceptors.request.use((req) => {
  const token = localStorage.getItem("agentToken");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  console.log(token);
  return req;
});



export const agentLogin = (data) => API.post("/login", data);
export const agentRegister = (data) => API.post("/register", data);
export const getAgentProfile = () => API.get("/profile");


export default API;
