// src/utils/doctorAxios.js
import axios from "axios";

const doctorAxios = axios.create({
  baseURL: "https://bioburglifescience-1.onrender.com/api/doctor",
});

doctorAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("doctorToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default doctorAxios;
