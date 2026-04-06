import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  import.meta.env.VITE_API_BASE_URL;

const VendorContext = createContext(null);

export function VendorProvider({ children }) {
  const [vendor, setVendor] = useState(() => {
    // Hydrate from localStorage instantly — no blink
    const photo = localStorage.getItem("vendorPhoto");
    const name  = localStorage.getItem("vendorName");
    return photo || name ? { ownerPhoto: photo, fullName: name } : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    if (!token) return;
    axios
      .get(`${API_BASE}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          const v = res.data.vendor;
          setVendor(v);
          localStorage.setItem("vendorPhoto", v.ownerPhoto || "");
          localStorage.setItem("vendorName",  v.fullName  || "");
        }
      })
      .catch(() => {});
  }, []);

  const updateVendor = (partial) =>
    setVendor((prev) => {
      const next = { ...prev, ...partial };
      if ("ownerPhoto" in partial)
        localStorage.setItem("vendorPhoto", partial.ownerPhoto || "");
      if ("fullName" in partial)
        localStorage.setItem("vendorName", partial.fullName || "");
      return next;
    });

  return (
    <VendorContext.Provider value={{ vendor, setVendor, updateVendor }}>
      {children}
    </VendorContext.Provider>
  );
}

export const useVendor = () => useContext(VendorContext);