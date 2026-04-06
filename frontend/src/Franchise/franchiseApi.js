import axios from "axios";
import { API_BASE_URL, API_URL } from "../config/api";

export const FRANCHISE_TOKEN_KEY = "franchiseToken";
export const LEGACY_FRANCHISE_TOKEN_KEY = "franchise_token";
export const FRANCHISE_USER_KEY = "franchiseUser";

const syncLegacyToken = () => {
  const primaryToken = localStorage.getItem(FRANCHISE_TOKEN_KEY);
  const legacyToken = localStorage.getItem(LEGACY_FRANCHISE_TOKEN_KEY);

  if (!primaryToken && legacyToken) {
    localStorage.setItem(FRANCHISE_TOKEN_KEY, legacyToken);
  }

  if (primaryToken && !legacyToken) {
    localStorage.setItem(LEGACY_FRANCHISE_TOKEN_KEY, primaryToken);
  }
};

export const getFranchiseToken = () => {
  syncLegacyToken();
  return (
    localStorage.getItem(FRANCHISE_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_FRANCHISE_TOKEN_KEY) ||
    null
  );
};

export const persistFranchiseUser = (account = {}) => {
  const franchiseUser = {
    email: account.email || "",
    fullName: account.fullName || account.application?.fullName || "",
    status: account.status || "",
    zoneId: account.zoneId || null,
    zoneName: account.zoneName || account.zoneId?.name || "",
    type: "franchise",
  };

  localStorage.setItem(FRANCHISE_USER_KEY, JSON.stringify(franchiseUser));
};

export const persistFranchiseSession = (token, account = {}) => {
  if (!token) {
    return;
  }

  localStorage.setItem(FRANCHISE_TOKEN_KEY, token);
  localStorage.setItem(LEGACY_FRANCHISE_TOKEN_KEY, token);
  localStorage.setItem("activeRole", "franchise");
  persistFranchiseUser(account);
};

export const clearFranchiseSession = () => {
  [
    FRANCHISE_TOKEN_KEY,
    LEGACY_FRANCHISE_TOKEN_KEY,
    FRANCHISE_USER_KEY,
  ].forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("activeRole");
};

const franchiseApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

franchiseApi.interceptors.request.use((config) => {
  const token = getFranchiseToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const FRANCHISE_API_BASE = `${API_URL}/franchise`;
export const FRANCHISE_AUTH_API_BASE = `${API_URL}/franchise-auth`;
export const FRANCHISE_SUPPORT_API_BASE = `${API_URL}/support`;
export const FRANCHISE_PUBLIC_BASE = API_BASE_URL;

export default franchiseApi;
