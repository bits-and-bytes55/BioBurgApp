import axios from "axios";
import { API_BASE_URL, API_URL } from "../../config/api";

const doctorApi = axios.create({
  baseURL: API_URL,
});

doctorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("doctorToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const DOCTOR_API_BASE_URL = `${API_BASE_URL}/api/doctor`;

export default doctorApi;
