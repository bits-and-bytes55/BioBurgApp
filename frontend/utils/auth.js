// utils/auth.js
const TOKEN_KEYS = {
  admin:        "adminToken",
  vendor:       "vendorToken",
  user:         "userToken",
  hospital:     "hospitalToken",
  pharmacy:     "pharmacyToken",
  franchise:    "franchiseToken",
  manufacturer: "mfgToken",
  doctor:       "doctorToken",
  delivery:     "daToken",
};

const USER_KEYS = [
  "user",
  "hospitalUser",
  "vendorUser",
  "doctorUser",
  "manufacturerUser",
  "franchiseUser",
  "pharmacyUser",
  "daAgent",
];

const SHARED_KEYS = [
  "activeRole",
  "token",
  "doctorId",
  "recentlyViewed",
];

export const getToken      = (role) => localStorage.getItem(TOKEN_KEYS[role]);
export const getActiveRole = ()     => localStorage.getItem("activeRole");
export const isLoggedIn    = (role) => !!localStorage.getItem(TOKEN_KEYS[role]);

export const loginAs = (role, token) => {
  Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
  USER_KEYS.forEach((k) => localStorage.removeItem(k));
  SHARED_KEYS.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(TOKEN_KEYS[role], token);
  localStorage.setItem("activeRole", role);
};

export const logout = () => {
  Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
  USER_KEYS.forEach((k) => localStorage.removeItem(k));
  SHARED_KEYS.forEach((k) => localStorage.removeItem(k));
};