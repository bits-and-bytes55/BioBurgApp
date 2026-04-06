import axios from "axios";

const apiUpload = axios.create({
  baseURL: "https://bioburglifescience-1.onrender.com",
  timeout: 60000, // images need more time
});

// ❗ Content-Type NEVER set here
apiUpload.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiUpload;
