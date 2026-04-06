import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    path: "/doctor",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/doctor/profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Availability",
    path: "/doctor/availability",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Consultations",
    path: "/doctor/consultations",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Prescriptions",
    path: "/doctor/prescriptions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
      </svg>
    ),
  },
  {
    label: "Wallet",
    path: "/doctor/wallet",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

const DoctorSidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    navigate("/login/doctor");
  };

  return (
    <aside
      style={{
        width: collapsed ? 72 : 248,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: collapsed ? "20px 16px" : "24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <p style={{ color: "#f8fafc", fontWeight: 700, fontSize: 14, margin: 0, letterSpacing: 0.3 }}>
              BioBurg Health
            </p>
            <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>Doctor Portal</p>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute",
          top: 20,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#3b82f6",
          border: "2px solid #0f172a",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          color: "white",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s" }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/doctor"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: collapsed ? "11px 22px" : "11px 20px",
              margin: "2px 8px",
              borderRadius: 10,
              textDecoration: "none",
              color: isActive ? "#f8fafc" : "#94a3b8",
              background: isActive
                ? "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(29,78,216,0.15) 100%)"
                : "transparent",
              borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
              transition: "all 0.18s",
              overflow: "hidden",
              whiteSpace: "nowrap",
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.style.background.includes("rgb(59")) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "#e2e8f0";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains("active")) {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "";
              }
            }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && (
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: collapsed ? "11px 22px" : "11px 20px",
            borderRadius: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#94a3b8",
            transition: "all 0.18s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#94a3b8";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && <span style={{ fontSize: 13.5, fontWeight: 500 }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default DoctorSidebar;