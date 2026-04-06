import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { logout as authLogout } from "../../utils/auth";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user shape: { name, email, type: "user"|"hospital"|"vendor"|"doctor"|"manufacturer"|"franchise"|"pharmacy" }
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // JWT in memory only
  const [loading, setLoading] = useState(true);

  // On app load, try to restore session from localStorage tokens
  // (temporary bridge — once backend supports refresh tokens/cookies, remove this)
  useEffect(() => {
      const roleMap = {
        hospital:     { tokenKey: "hospitalToken",     userKey: "hospitalUser" },
        user:         { tokenKey: "userToken",         userKey: "user" },
        vendor:       { tokenKey: "vendorToken",       userKey: "vendorUser" },
        doctor:       { tokenKey: "doctorToken",       userKey: "doctorUser" },
        manufacturer: { tokenKey: "mfgToken",          userKey: "manufacturerUser" },
        franchise:    { tokenKey: "franchiseToken",    userKey: "franchiseUser" },
        pharmacy:     { tokenKey: "pharmacyToken",     userKey: "pharmacyUser" },
        delivery:     { tokenKey: "daToken",           userKey: "daAgent" },
        admin:        { tokenKey: "adminToken",        userKey: null },
      };

      const activeRole = localStorage.getItem("activeRole");
      const check      = roleMap[activeRole];

      if (check) {
        const storedToken = localStorage.getItem(check.tokenKey);
        const storedUser  = check.userKey ? localStorage.getItem(check.userKey) : null;
        if (storedToken) {
          try {
            const parsed = storedUser ? JSON.parse(storedUser) : {};
            setToken(storedToken);
            setUser({ ...parsed, type: activeRole });
            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          } catch (_) {}
        }
      }
      setLoading(false);
  }, []);

  /**
   * Call this after any successful login API response.
   * @param {string} jwtToken  - the JWT from backend
   * @param {object} userData  - { name, email, type }
   * @param {string} tokenKey  - localStorage key to persist token (e.g. "hospitalToken")
   * @param {string} userKey   - localStorage key to persist user  (e.g. "hospitalUser")
   */
  const login = (jwtToken, userData, tokenKey, userKey) => {
  setToken(jwtToken);
  setUser(userData);
  axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
  localStorage.setItem(tokenKey, jwtToken);
  localStorage.setItem(userKey, JSON.stringify(userData));
  localStorage.setItem("activeRole", userData.type); 
};

  const logout = () => {
  setToken(null);
  setUser(null);
  delete axios.defaults.headers.common["Authorization"];
  authLogout(); 
};

  const isLoggedIn  = !!token;
  const isHospital  = user?.type === "hospital";
  const isUser      = user?.type === "user";
  const isVendor    = user?.type === "vendor";
  const isDoctor    = user?.type === "doctor";

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout,
      isLoggedIn, isHospital, isUser, isVendor, isDoctor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;
