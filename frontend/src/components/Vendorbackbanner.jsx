import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

// Portal routes where the banner must NOT appear
const PORTAL_PREFIXES = [
  "/hospital", "/pharmacy", "/admin", "/vendor", "/doctor",
  "/agent", "/delivery", "/manufacturer", "/partner", "/lab",
  "/franchise", "/userlogin", "/userregister", "/login", "/register",
];

// Portal session configs — checked in priority order
const PORTAL_SESSIONS = [
  {
    role    : "vendor",
    tokenKey: "vendorToken",
    userKey : "vendorUser",
    label   : "Vendor Portal",
    dashRoute: "/vendor/dashboard",
    accent  : "#7c3aed",
    text    : "#c4b5fd",
    border  : "rgba(124,58,237,0.45)",
  },
  {
    role    : "hospital",
    tokenKey: "hospitalToken",
    userKey : "hospitalUser",
    label   : "Hospital Portal",
    dashRoute: "/hospital/dashboard",
    accent  : "#0891b2",
    text    : "#7dd3fc",
    border  : "rgba(8,145,178,0.45)",
  },
  {
    role    : "pharmacy",
    tokenKey: "pharmacyToken",
    userKey : "pharmacyUser",
    label   : "Pharmacy Portal",
    dashRoute: "/pharmacy/dashboard",
    accent  : "#059669",
    text    : "#6ee7b7",
    border  : "rgba(5,150,105,0.45)",
  },
  {
    role    : "doctor",
    tokenKey: "doctorToken",
    userKey : "doctorUser",
    label   : "Doctor Portal",
    dashRoute: "/doctor/dashboard",
    accent  : "#2563eb",
    text    : "#93c5fd",
    border  : "rgba(37,99,235,0.45)",
  },
];

function readSession() {
  for (const cfg of PORTAL_SESSIONS) {
    const token = localStorage.getItem(cfg.tokenKey);
    if (!token || token === "null" || token === "undefined") continue;

    let user = null;
    try { user = JSON.parse(localStorage.getItem(cfg.userKey) || "null"); } catch { /**/ }

    const name =
      user?.businessName  ||
      user?.fullName      ||
      user?.name          ||
      user?.contactPerson ||
      user?.hospitalName  ||
      user?.pharmacyName  ||
      user?.doctorName    ||
      cfg.label;

    return { ...cfg, name };
  }
  return null;
}

export default function VendorBackBanner() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [session,   setSession]   = useState(() => readSession());

  const refresh = useCallback(() => setSession(readSession()), []);

  // Re-read on every route change & reset dismiss
  useEffect(() => {
    setDismissed(false);
    refresh();
  }, [location.pathname, refresh]);

  // Poll for 4 s after mount (catches token written just before window.open)
  useEffect(() => {
    refresh();
    let tries = 0;
    const id = setInterval(() => {
      refresh();
      if (++tries >= 8) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [refresh]);

  // Cross-tab localStorage changes
  useEffect(() => {
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  const isOnMainSite = !PORTAL_PREFIXES.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  if (!session || !isOnMainSite || dismissed) return null;

  const { emoji, label, dashRoute, accent, text, border, name } = session;
  const returnPath = sessionStorage.getItem("vendorReturnDashboard") || dashRoute;

  return (
    <div style={{
      width         : "100%",
      minHeight     : 42,
      background    : "#0f172a",
      borderBottom  : `2px solid ${border}`,
      padding       : "0 16px",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "space-between",
      fontFamily    : "'Segoe UI', Inter, system-ui, sans-serif",
      zIndex        : 99999,
      position      : "sticky",
      top           : 0,
      flexShrink    : 0,
      boxSizing     : "border-box",
      flexWrap      : "wrap",
      gap           : 8,
    }}>
      {/* LEFT */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          background   : `${accent}28`,
          border       : `1px solid ${border}`,
          color        : text,
          fontSize     : 10,
          fontWeight   : 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          padding      : "2px 9px",
          borderRadius : 4,
          whiteSpace   : "nowrap",
        }}>
          {emoji} {label}
        </span>
        <span style={{ width:1, height:14, background:"rgba(255,255,255,0.10)", display:"inline-block" }} />
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>
          Signed in as&nbsp;
          <strong style={{ color:"rgba(255,255,255,0.88)", fontWeight:600 }}>{name}</strong>
        </span>
      </div>

      {/* RIGHT */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button
          onClick={() => navigate(returnPath)}
          style={{
            background   : `${accent}22`,
            color        : text,
            border       : `1px solid ${border}`,
            padding      : "4px 14px",
            borderRadius : 4,
            cursor       : "pointer",
            fontWeight   : 600,
            fontSize     : 12,
            fontFamily   : "inherit",
            transition   : "all 0.15s",
            whiteSpace   : "nowrap",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}44`; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${accent}22`; e.currentTarget.style.color = text; }}
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss"
          style={{
            background:"transparent", color:"rgba(255,255,255,0.30)",
            border:"none", cursor:"pointer", fontSize:18, lineHeight:1,
            padding:"2px 6px", borderRadius:4, fontFamily:"inherit", transition:"color 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.80)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.30)"}
        >✕</button>
      </div>
    </div>
  );
}