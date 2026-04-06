import axios from "axios";
import { API_URL } from "../config/api";

export const MANUFACTURER_TOKEN_KEY = "manufacturerToken";
export const LEGACY_MANUFACTURER_TOKEN_KEY = "mfgToken";
export const MANUFACTURER_USER_KEY = "manufacturerUser";

export const getManufacturerToken = () =>
  localStorage.getItem(MANUFACTURER_TOKEN_KEY) ||
  localStorage.getItem(LEGACY_MANUFACTURER_TOKEN_KEY) ||
  null;

export const persistManufacturerSession = (token, manufacturer = {}) => {
  if (!token) {
    return;
  }

  localStorage.setItem(MANUFACTURER_TOKEN_KEY, token);
  localStorage.setItem(LEGACY_MANUFACTURER_TOKEN_KEY, token);
  localStorage.setItem("activeRole", "manufacturer");
  localStorage.setItem(
    MANUFACTURER_USER_KEY,
    JSON.stringify({
      id: manufacturer.id || "",
      fullName: manufacturer.fullName || "",
      companyName: manufacturer.companyName || "",
      officialEmail: manufacturer.officialEmail || "",
      username: manufacturer.username || "",
      applicationStatus: manufacturer.applicationStatus || "",
      documentReviewStatus: manufacturer.documentReviewStatus || "",
      accountStatus: manufacturer.accountStatus || "",
      isVerified: Boolean(manufacturer.isVerified),
      type: "manufacturer",
    }),
  );
};

export const clearManufacturerSession = () => {
  localStorage.removeItem(MANUFACTURER_TOKEN_KEY);
  localStorage.removeItem(LEGACY_MANUFACTURER_TOKEN_KEY);
  localStorage.removeItem(MANUFACTURER_USER_KEY);
  localStorage.removeItem("activeRole");
};

const manufacturerApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

manufacturerApi.interceptors.request.use((config) => {
  const token = getManufacturerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const MANUFACTURER_API_BASE = `${API_URL}/manufacturer`;

export default manufacturerApi;
