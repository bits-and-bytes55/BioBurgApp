import axios from "axios";
import { API_URL } from "./api.js";


const agentApi = axios.create({
  baseURL: `${API_URL}/agent`,
  timeout: 30000,
});

// DO NOT set Content-Type here
agentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("agentToken"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default agentApi;