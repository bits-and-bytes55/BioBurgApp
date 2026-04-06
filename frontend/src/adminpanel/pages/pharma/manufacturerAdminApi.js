import axios from "axios";
import { API_URL } from "../../../config/api";

const manufacturerAdminApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

manufacturerAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default manufacturerAdminApi;
