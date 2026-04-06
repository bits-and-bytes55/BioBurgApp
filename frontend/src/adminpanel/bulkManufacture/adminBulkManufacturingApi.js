import axios from "axios";
import { API_URL } from "../../config/api";

const adminBulkManufacturingApi = axios.create({
  baseURL: `${API_URL}/admin/bulk-manufacturing`,
  headers: { "Content-Type": "application/json" },
});

adminBulkManufacturingApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default adminBulkManufacturingApi;
