// src/components/PharmacyBackBanner.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function PharmacyBackBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { setDismissed(false); }, [location.pathname]);

  const pharmacyToken = localStorage.getItem("pharmacyToken");
  const pharmacyUser  = localStorage.getItem("pharmacyUser");

  useEffect(() => {
    if (!pharmacyToken) sessionStorage.removeItem("pharmacyReturnDashboard");
  }, [pharmacyToken]);

  const PORTAL_ROUTES = [
    "/hospital", "/pharmacy", "/admin", "/vendor", "/doctor",
    "/agent", "/delivery", "/manufacturer", "/partner", "/lab",
    "/franchise", "/userlogin", "/userregister",
  ];
  const isOnMainSite = !PORTAL_ROUTES.some(r => location.pathname.startsWith(r));

  const shouldShow = !!pharmacyToken && !!pharmacyUser && isOnMainSite && !dismissed;
  if (!shouldShow) return null;

  const stored = JSON.parse(pharmacyUser || "{}");
  const name   = stored?.facilityName || stored?.contactPerson || stored?.name || "Pharmacy Admin";

  return (
    <div style={{
      width         : "100%",
      height        : 40,
      background    : "#0f172a",
      borderBottom  : "1px solid rgba(255,255,255,0.08)",
      padding       : "0 24px",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "space-between",
      fontFamily    : "'Segoe UI', Inter, system-ui, sans-serif",
      flexShrink    : 0,
    }}>

      {/* LEFT */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          background   : "rgba(255,255,255,0.07)",
          border       : "1px solid rgba(255,255,255,0.12)",
          color        : "rgba(255,255,255,0.65)",
          fontSize     : 10.5,
          fontWeight   : 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          padding      : "2px 10px",
          borderRadius : 4,
        }}>
          Pharmacy Portal
        </span>

        <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", display: "inline-block" }} />

        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Signed in as&nbsp;
          <strong style={{ color: "rgba(255,255,255,0.82)", fontWeight: 600 }}>{name}</strong>
        </span>
      </div>

      {/* RIGHT */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => navigate("/pharmacy/dashboard")}
          style={{
            background   : "rgba(255,255,255,0.08)",
            color        : "rgba(255,255,255,0.9)",
            border       : "1px solid rgba(255,255,255,0.15)",
            padding      : "4px 14px",
            borderRadius : 4,
            cursor       : "pointer",
            fontWeight   : 600,
            fontSize     : 12,
            fontFamily   : "inherit",
            letterSpacing: "0.01em",
            transition   : "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background  = "rgba(255,255,255,0.14)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }}
        >
          Back to Dashboard
        </button>

        <button
          onClick={() => setDismissed(true)}
          title="Dismiss"
          style={{
            background  : "transparent",
            color       : "rgba(255,255,255,0.28)",
            border      : "none",
            cursor      : "pointer",
            fontSize    : 18,
            lineHeight  : 1,
            padding     : "2px 5px",
            borderRadius: 4,
            fontFamily  : "inherit",
            transition  : "color 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.28)"}
        >
          &times;
        </button>
      </div>
    </div>
  );
}