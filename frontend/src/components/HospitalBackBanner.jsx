// src/components/HospitalBackBanner.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function HospitalBackBanner() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {}, [location.pathname]);

  const hospitalToken = localStorage.getItem("hospitalToken");
  const hospitalUser  = localStorage.getItem("hospitalUser");

  useEffect(() => {
    if (!hospitalToken) sessionStorage.removeItem("hospitalReturnDashboard");
  }, [hospitalToken]);

  const PORTAL_ROUTES = [
    "/hospital", "/pharmacy", "/admin", "/vendor", "/doctor",
    "/agent", "/delivery", "/manufacturer", "/partner", "/lab",
    "/franchise", "/userlogin", "/userregister",
  ];

  const isOnMainSite = !PORTAL_ROUTES.some(r =>
    location.pathname.startsWith(r)
  );

  const shouldShow = !!hospitalToken && !!hospitalUser && isOnMainSite;
  if (!shouldShow) return null;

  const stored = JSON.parse(hospitalUser || "{}");
  const name =
    stored?.facilityName ||
    stored?.contactPerson ||
    stored?.name ||
    "Hospital Admin";

  return (
    <div
      style={{
        width: "100%",
        height: 40,
        background: "#0f172a",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      {/* LEFT */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.65)",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "2px 10px",
            borderRadius: 4,
          }}
        >
          Hospital Portal
        </span>

        <span
          style={{
            width: 1,
            height: 14,
            background: "rgba(255,255,255,0.1)",
            display: "inline-block",
          }}
        />

        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Signed in as&nbsp;
          <strong
            style={{
              color: "rgba(255,255,255,0.82)",
              fontWeight: 600,
            }}
          >
            {name}
          </strong>
        </span>
      </div>

      {/* RIGHT */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => navigate("/hospital/dashboard")}
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "4px 14px",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 12,
            fontFamily: "inherit",
            letterSpacing: "0.01em",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.14)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}