export const getActiveToken = () => {
  return (
    localStorage.getItem("userToken") ||  
    localStorage.getItem("hospitalToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("vendorToken") ||
    localStorage.getItem("doctorToken") ||
    localStorage.getItem("manufacturerToken") ||
    localStorage.getItem("franchiseToken") ||
    localStorage.getItem("pharmacyToken") ||
    null
  );
};

export const isLoggedIn = () => !!getActiveToken();

export const getActiveUser = () => {
  const keys = [
    "hospitalUser", "user", "vendorUser", "doctorUser",
    "manufacturerUser", "franchiseUser", "pharmacyUser"
  ];
  for (const key of keys) {
    const stored = localStorage.getItem(key);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
  }
  return null;
};

export const isAnyUserLoggedIn = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("hospitalToken") ||
    localStorage.getItem("vendorToken") ||
    localStorage.getItem("doctorToken") ||
    localStorage.getItem("manufacturerToken") ||
    localStorage.getItem("pharmacyToken") ||
    localStorage.getItem("franchiseToken")
  );
};