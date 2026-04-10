import axios from "axios";
import { getToken, getActiveRole, logout } from "../utils/auth.js";
import { API_BASE_URL } from "../src/config/api";

const BASE = API_BASE_URL;

const handle401 = (role) => {
  logout(role);
  const loginRoutes = {
    admin:        "/admin-login",
    vendor:       "/vendor-login",
    hospital:     "/hospital-login",
    pharmacy:     "/pharmacy-login",
    franchise:    "/franchise-login",
    manufacturer: "/manufacturer-login",
    doctor:       "/doctor-login",
    delivery:     "/delivery-login",
    user:         "/login",
  };
  window.location.href = loginRoutes[role] || "/login";
};

//  Admin instance 
const api = axios.create({ baseURL: BASE, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = getToken("admin");

  // No admin token = abort the request silently (don't hit server)
  if (!token) {
    const controller = new AbortController();
    controller.abort();
    return { ...config, signal: controller.signal };
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    //  Ignore aborted requests (from non-admin pages)
    if (axios.isCancel(err) || err.code === "ERR_CANCELED") {
      return Promise.resolve({ data: null }); // silent fail
    }
    if (err.response?.status === 401) handle401("admin");
    return Promise.reject(err);
  }
);

export default api;

// ── Website / Role instance 
export const userApi = axios.create({ baseURL: BASE, timeout: 30000 });

userApi.interceptors.request.use((config) => {
  const role = getActiveRole();
  const token = role
    ? getToken(role)
    : localStorage.getItem("token");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

userApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const role = getActiveRole() || "user";
      handle401(role);
    }
    return Promise.reject(err);
  }
);