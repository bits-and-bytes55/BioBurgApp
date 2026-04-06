import axios from "axios";
import { API_URL } from "../config/api";

export const BULK_MANUFACTURING_TOKEN_KEY = "bulkManufacturingToken";
export const BULK_MANUFACTURING_USER_KEY = "bulkManufacturingUser";

export const getBulkManufacturingToken = () =>
  localStorage.getItem(BULK_MANUFACTURING_TOKEN_KEY) || null;

export const persistBulkManufacturingSession = (token, account = {}) => {
  if (!token) {
    return;
  }

  localStorage.setItem(BULK_MANUFACTURING_TOKEN_KEY, token);
  localStorage.setItem("activeRole", "bulk-manufacturing");
  localStorage.setItem(
    BULK_MANUFACTURING_USER_KEY,
    JSON.stringify({
      id: account.id || "",
      username: account.username || "",
      email: account.email || "",
      companyName: account.companyName || "",
      contactName: account.contactName || "",
      status: account.status || "",
      country: account.country || "",
      requestStatus: account.request?.status || "",
      documentReviewStatus: account.request?.documentReviewStatus || "",
      type: "bulk-manufacturing",
    }),
  );
};

export const clearBulkManufacturingSession = () => {
  localStorage.removeItem(BULK_MANUFACTURING_TOKEN_KEY);
  localStorage.removeItem(BULK_MANUFACTURING_USER_KEY);
  localStorage.removeItem("activeRole");
};

const bulkManufacturingApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

bulkManufacturingApi.interceptors.request.use((config) => {
  const token = getBulkManufacturingToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const BULK_MANUFACTURING_AUTH_API_BASE = `${API_URL}/bulk-manufacturing-auth`;
export const BULK_MANUFACTURING_PORTAL_API_BASE = `${API_URL}/bulk-manufacturing-portal`;

export default bulkManufacturingApi;
