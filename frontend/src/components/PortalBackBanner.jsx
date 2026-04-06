// src/components/PortalBackBanner.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// ─── Portal definitions ────────────────────────────────────────────────────
// Add new portals here — no other file needs to change.
const PORTALS = [
  {
    key        : "vendor",
    tokenKey   : "vendorToken",
    userKey    : "vendorUser",
    label      : "Vendor Portal",
    dashRoute  : "/vendor/dashboard",
    accentColor: "rgba(124,58,237,0.22)",
    borderColor: "rgba(167,139,250,0.45)",
    textColor  : "#a78bfa",
    btnBg      : "rgba(124,58,237,0.15)",
    btnBorder  : "rgba(124,58,237,0.40)",
    btnText    : "#a78bfa",
    btnHoverBg : "rgba(124,58,237,0.28)",
    btnHoverBorder: "rgba(167,139,250,0.70)",
    btnHoverText  : "#c4b5fd",
    getName    : (u) => u?.businessName || u?.contactPerson || u?.fullName || u?.name || "Vendor",
  },
  {
    key        : "hospital",
    tokenKey   : "hospitalToken",
    userKey    : "hospitalUser",
    label      : "Hospital Portal",
    dashRoute  : "/hospital/dashboard",
    accentColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.14)",
    textColor  : "rgba(255,255,255,0.65)",
    btnBg      : "rgba(255,255,255,0.08)",
    btnBorder  : "rgba(255,255,255,0.18)",
    btnText    : "rgba(255,255,255,0.90)",
    btnHoverBg : "rgba(255,255,255,0.16)",
    btnHoverBorder: "rgba(255,255,255,0.35)",
    btnHoverText  : "#fff",
    getName    : (u) => u?.facilityName || u?.hospitalName || u?.contactPerson || u?.name || "Hospital",
  },
  {
    key        : "pharmacy",
    tokenKey   : "pharmacyToken",
    userKey    : "pharmacyUser",
    label      : "Pharmacy Portal",
    dashRoute  : "/pharmacy/dashboard",
    accentColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.14)",
    textColor  : "rgba(255,255,255,0.65)",
    btnBg      : "rgba(255,255,255,0.08)",
    btnBorder  : "rgba(255,255,255,0.18)",
    btnText    : "rgba(255,255,255,0.90)",
    btnHoverBg : "rgba(255,255,255,0.16)",
    btnHoverBorder: "rgba(255,255,255,0.35)",
    btnHoverText  : "#fff",
    getName    : (u) => u?.facilityName || u?.pharmacyName || u?.contactPerson || u?.name || "Pharmacy",
  },
];

// Routes where the banner should NEVER appear
const PORTAL_ROUTE_PREFIXES = [
  "/hospital", "/pharmacy", "/admin", "/vendor", "/doctor",
  "/agent", "/delivery", "/manufacturer", "/partner", "/lab",
  "/franchise", "/bulk-manufacturing", "/userlogin", "/userregister",
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function PortalBackBanner() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dismissed,    setDismissed]    = useState(false);
  const [activePortal, setActivePortal] = useState(null); // portal config object
  const [displayName,  setDisplayName]  = useState("");

  // ── Detect which portal is active ───────────────────────────────────────
  const detectPortal = () => {
    for (const p of PORTALS) {
      const token   = localStorage.getItem(p.tokenKey);
      const userRaw = localStorage.getItem(p.userKey);
      if (token && userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setActivePortal(p);
          setDisplayName(p.getName(user));
          return;
        } catch {
          // JSON parse failed — try next portal
        }
      }
    }
    setActivePortal(null);
    setDisplayName("");
  };

  // Re-detect on every route change
  useEffect(() => {
    setDismissed(false);
    detectPortal();
  }, [location.pathname]);

  // Poll briefly on mount so the banner appears immediately after login
  useEffect(() => {
    detectPortal();
    let tries = 0;
    const id = setInterval(() => {
      detectPortal();
      if (++tries >= 8) clearInterval(id);
    }, 400);
    window.addEventListener("storage", detectPortal);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", detectPortal);
    };
  }, []);

  // ── Guard: only show on main-site pages ─────────────────────────────────
  const isOnMainSite = !PORTAL_ROUTE_PREFIXES.some(
    (r) => location.pathname === r || location.pathname.startsWith(r + "/")
  );

  if (!activePortal || !isOnMainSite || dismissed) return null;

  const p = activePortal;

  return (
    <div style={{
      width         : "100%",
      height        : 42,
      background    : "#0f172a",
      borderBottom  : `1px solid ${p.borderColor}`,
      padding       : "0 20px",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "space-between",
      fontFamily    : "'Segoe UI', Inter, system-ui, sans-serif",
      flexShrink    : 0,
      zIndex        : 9999,
      position      : "sticky",
      top           : 0,
    }}>

      {/* LEFT — badge + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          background   : p.accentColor,
          border       : `1px solid ${p.borderColor}`,
          color        : p.textColor,
          fontSize     : 10,
          fontWeight   : 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          padding      : "2px 9px",
          borderRadius : 4,
          whiteSpace   : "nowrap",
        }}>
          {p.emoji} {p.label}
        </span>

        <span style={{
          width     : 1, height: 14,
          background: "rgba(255,255,255,0.10)",
          display   : "inline-block",
        }} />

        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap" }}>
          Signed in as&nbsp;
          <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
            {displayName}
          </strong>
        </span>
      </div>

      {/* RIGHT — back + dismiss */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => {
            const returnPath =
              sessionStorage.getItem("vendorReturnDashboard") ||
              sessionStorage.getItem("portalReturnPath") ||
              p.dashRoute;
            navigate(returnPath);
          }}
          style={{
            background   : p.btnBg,
            color        : p.btnText,
            border       : `1px solid ${p.btnBorder}`,
            padding      : "4px 14px",
            borderRadius : 4,
            cursor       : "pointer",
            fontWeight   : 600,
            fontSize     : 12,
            fontFamily   : "inherit",
            letterSpacing: "0.01em",
            transition   : "all 0.15s",
            whiteSpace   : "nowrap",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = p.btnHoverBg;
            e.currentTarget.style.borderColor  = p.btnHoverBorder;
            e.currentTarget.style.color        = p.btnHoverText;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = p.btnBg;
            e.currentTarget.style.borderColor  = p.btnBorder;
            e.currentTarget.style.color        = p.btnText;
          }}
        >
          ← Back to Dashboard
        </button>

        <button
          onClick={() => setDismissed(true)}
          title="Dismiss"
          style={{
            background  : "transparent",
            color       : "rgba(255,255,255,0.30)",
            border      : "none",
            cursor      : "pointer",
            fontSize    : 18,
            lineHeight  : 1,
            padding     : "2px 5px",
            borderRadius: 4,
            fontFamily  : "inherit",
            transition  : "color 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
        >
          &times;
        </button>
      </div>
    </div>
  );
}