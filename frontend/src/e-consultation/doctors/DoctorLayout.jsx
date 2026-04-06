// frontend/src/e-consultation/doctors/DoctorLayout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({ baseURL: `${BASE_URL}/api` });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("doctorToken");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const NAV = [
  { label: "Dashboard",     path: "/doctor",               end: true,
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { label: "Profile",       path: "/doctor/profile",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { label: "Availability",  path: "/doctor/availability",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { label: "Consultations", path: "/doctor/consultations",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { label: "Prescriptions",path: "/doctor/prescriptions",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/></svg> },
  { label: "Wallet",        path: "/doctor/wallet",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, doctor, available, onToggle, onClose, isMobile }) => {
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await api.patch("/doctor/toggle-availability", { available: !available });
      onToggle(res.data.available);
    } catch { onToggle(!available); } // optimistic fallback
    finally { setToggling(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    navigate("/login/doctor");
  };

  const photoSrc = doctor?.photo
    ? (doctor.photo.startsWith("http") ? doctor.photo : `${BASE_URL}${doctor.photo}`)
    : null;
  const initials = (doctor?.fullName || "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside style={{
      width: isMobile ? 260 : collapsed ? 68 : 236,
      minHeight: "100vh",
      background: "#0a0f1c",
      display: "flex", flexDirection: "column",
      transition: isMobile ? "none" : "width 0.22s cubic-bezier(.4,0,.2,1)",
      flexShrink: 0, position: "relative", zIndex: 20,
      borderRight: "1px solid rgba(255,255,255,.06)",
    }}>

      {/* Logo row */}
      <div style={{
        padding: "18px 16px",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        display: "flex", alignItems: "center", gap: 10, overflow: "hidden",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/>
          </svg>
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, margin: 0, fontFamily: "'Sora',sans-serif" }}>BioBurg Health</p>
            <p style={{ color: "#334155", fontSize: 10, margin: 0 }}>Doctor Portal</p>
          </div>
        )}
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, padding: 2, marginLeft: "auto" }}>✕</button>
        )}
      </div>

      {/* Doctor mini card */}
      {(!collapsed || isMobile) && doctor && (
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            {photoSrc ? (
              <img src={photoSrc} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.1)", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#e2e8f0", fontSize: 12.5, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doctor.fullName}</p>
              <p style={{ color: "#475569", fontSize: 10.5, margin: "1px 0 0" }}>{doctor.specialization}</p>
            </div>
          </div>

          {/* Online toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${available ? "rgba(34,197,94,.3)" : "rgba(100,116,139,.3)"}`,
              background: available ? "rgba(34,197,94,.1)" : "rgba(100,116,139,.08)",
              color: available ? "#86efac" : "#64748b",
              cursor: "pointer", fontSize: 11.5, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all .2s",
            }}
          >
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: available ? "#22c55e" : "#475569",
              boxShadow: available ? "0 0 0 3px rgba(34,197,94,.25)" : "none",
              animation: available ? "pulse 2s infinite" : "none",
            }} />
            {toggling ? "Updating…" : available ? "Online — Click to go Offline" : "Offline — Click to go Online"}
          </button>
        </div>
      )}

      {/* Collapsed: just avatar + toggle dot */}
      {collapsed && !isMobile && doctor && (
        <div style={{ padding: "12px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            {photoSrc ? (
              <img src={photoSrc} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.1)" }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{initials}</div>
            )}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: "50%",
              background: available ? "#22c55e" : "#475569",
              border: "2px solid #0a0f1c",
            }} />
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map(item => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.end}
            onClick={() => isMobile && onClose && onClose()}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center",
              gap: 10,
              padding: collapsed && !isMobile ? "11px 0" : "10px 16px",
              justifyContent: collapsed && !isMobile ? "center" : "flex-start",
              margin: "1px 8px",
              borderRadius: 9,
              textDecoration: "none",
              color: isActive ? "#fff" : "#4b5563",
              background: isActive ? "rgba(37,99,235,.25)" : "transparent",
              borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
              transition: "all .15s",
              overflow: "hidden", whiteSpace: "nowrap",
            })}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {(!collapsed || isMobile) && (
              <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: 10, padding: collapsed && !isMobile ? "10px 0" : "10px 16px",
            justifyContent: collapsed && !isMobile ? "center" : "flex-start",
            borderRadius: 9, background: "transparent", border: "none",
            cursor: "pointer", color: "#4b5563", transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.1)"; e.currentTarget.style.color = "#fca5a5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4b5563"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {(!collapsed || isMobile) && <span style={{ fontSize: 13, fontWeight: 500 }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function DoctorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [doctor, setDoctor] = useState(null);
  const [available, setAvailable] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  // Responsive listener
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Load doctor profile
  useEffect(() => {
    const token = localStorage.getItem("doctorToken");
    if (!token) { window.location.href = "/login/doctor"; return; }
    api.get("/doctor/profile")
      .then(res => { setDoctor(res.data); setAvailable(res.data.available || false); })
      .catch(err => { if (err.response?.status === 401) window.location.href = "/login/doctor"; });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes slideIn { from{transform:translateX(-100%)}to{transform:translateX(0)} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* Desktop sidebar */}
        {!isMobile && (
          <Sidebar
            collapsed={collapsed}
            doctor={doctor}
            available={available}
            onToggle={setAvailable}
          />
        )}

        {/* Mobile sidebar overlay */}
        {isMobile && mobileOpen && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 30, backdropFilter: "blur(2px)" }}
            />
            <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40, animation: "slideIn .2s ease" }}>
              <Sidebar
                isMobile
                doctor={doctor}
                available={available}
                onToggle={setAvailable}
                onClose={() => setMobileOpen(false)}
              />
            </div>
          </>
        )}

        {/* Main content area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Top bar */}
          <header style={{
            height: 56,
            background: "#fff",
            borderBottom: "1px solid #e8ecf0",
            display: "flex", alignItems: "center",
            padding: "0 20px", gap: 12,
            position: "sticky", top: 0, zIndex: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          }}>
            {/* Mobile hamburger */}
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#334155", padding: 4, display: "flex",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}

            {/* Desktop collapse toggle */}
            {!isMobile && (
              <button onClick={() => setCollapsed(c => !c)} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "#f1f5f9", border: "1px solid #e2e8f0",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#64748b",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            )}

            {/* Breadcrumb */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Doctor</span>
              <span style={{ fontSize: 12, color: "#cbd5e1" }}>/</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'Sora',sans-serif" }}>
                {NAV.find(n => n.path === location.pathname)?.label || "Dashboard"}
              </span>
            </div>

            {/* Online badge in header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: available ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${available ? "#bbf7d0" : "#e2e8f0"}`,
              borderRadius: 8, padding: "5px 12px",
              fontSize: 11.5, fontWeight: 600,
              color: available ? "#15803d" : "#64748b",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: available ? "#22c55e" : "#94a3b8",
                animation: available ? "pulse 2s infinite" : "none",
              }} />
              {available ? "Online" : "Offline"}
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, padding: "clamp(16px, 3vw, 32px)", overflowY: "auto" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}