import React, { useEffect, useState } from "react";
import api from "./doctorApi";
//  import axios from "axios";
const card = {
  background: "#ffffff",
  borderRadius: 16,
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  border: "1px solid #e2e8f0",
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/api";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("doctorToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
const StatCard = ({ title, value, icon, color, trend, trendLabel }) => (
  <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <p
          style={{
            color: "#64748b",
            fontSize: 13,
            fontWeight: 500,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </p>
        <p
          style={{
            color: "#0f172a",
            fontSize: 32,
            fontWeight: 700,
            margin: "6px 0 0",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
    {trend !== undefined && (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: trend >= 0 ? "#16a34a" : "#dc2626",
            background: trend >= 0 ? "#dcfce7" : "#fee2e2",
            padding: "2px 8px",
            borderRadius: 100,
          }}
        >
          {trend >= 0 ? "+" : ""}
          {trend}%
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{trendLabel}</span>
      </div>
    )}
  </div>
);

const activityIcon = (type) => {
  const icons = {
    prescription: { icon: "Rx", color: "#8b5cf6", bg: "#f3e8ff" },
    consultation: { icon: "✓", color: "#16a34a", bg: "#dcfce7" },
    availability: { icon: "◷", color: "#0284c7", bg: "#e0f2fe" },
    wallet: { icon: "₹", color: "#d97706", bg: "#fef3c7" },
  };
  return icons[type] || icons.consultation;
};

const avatarColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b"];

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalConsultations: 0,
    todayAppointments: 0,
    pendingConsultations: 0,
    totalEarnings: 0,
  });

  const [appointments, setAppointments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("doctorToken");

  useEffect(() => {
    if (!token) return;
    const fetch = async () => {
      try {
        const res = await api.get(`${BASE_URL}/api/doctor/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const res2 = await api.get(`${BASE_URL}/api/doctor/consultations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const res3 = await api.get(`${BASE_URL}/api/doctor/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setActivity(
          Array.isArray(res3.data) ? res3.data : res3.data.activity || [],
        );

        setAppointments(res2.data.data || []);
        setStats(res.data.data || res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("doctorToken");
          window.location.href = "/login/doctor";
        }
        // fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{today}</p>
        <h1
          style={{
            color: "#0f172a",
            fontSize: 26,
            fontWeight: 700,
            margin: "4px 0 0",
          }}
        >
          Good morning, Doctor 👋
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "6px 0 0" }}>
          Here's what's happening with your practice today.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: 48 }}>
          Loading dashboard...
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 20,
              marginBottom: 28,
            }}
          >
            <StatCard
              title="Total Consultations"
              value={stats.totalConsultations}
              color="#3b82f6"
              trend={12}
              trendLabel="vs last month"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
            />
            <StatCard
              title="Today's Appointments"
              value={stats.todayAppointments}
              color="#8b5cf6"
              trend={0}
              trendLabel="scheduled"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
            <StatCard
              title="Pending Reviews"
              value={stats.pendingConsultations}
              color="#f59e0b"
              trend={-3}
              trendLabel="vs yesterday"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
            <StatCard
              title="Total Earnings"
              value={`₹${stats.totalEarnings?.toLocaleString("en-IN")}`}
              color="#16a34a"
              trend={8}
              trendLabel="vs last month"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
          </div>

          {/* Bottom Section */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            {/* Upcoming Consultations */}
            <div style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Today's Schedule
                </h2>
                <span
                  style={{
                    background: "#eff6ff",
                    color: "#3b82f6",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 100,
                  }}
                >
                  {appointments.length} upcoming
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {appointments.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px",
                      background: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: avatarColors[i % avatarColors.length],
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {c.patientName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: "#0f172a",
                          fontSize: 13.5,
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {c.patientName}
                      </p>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          margin: "2px 0 0",
                        }}
                      >
                        {c.time}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 100,
                        background:
                          c.mode === "Video"
                            ? "#eff6ff"
                            : c.mode === "Audio"
                              ? "#f0fdf4"
                              : "#fdf4ff",

                        color:
                          c.mode === "Video"
                            ? "#3b82f6"
                            : c.mode === "Audio"
                              ? "#16a34a"
                              : "#9333ea",
                      }}
                    >
                      {c.mode}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={card}>
              <h2
                style={{
                  color: "#0f172a",
                  fontSize: 15,
                  fontWeight: 700,
                  margin: "0 0 20px",
                }}
              >
                Recent Activity
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {activity.map((a, i) => {
                  const meta = activityIcon(a.type);
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: meta.bg,
                          color: meta.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <p
                          style={{
                            color: "#334155",
                            fontSize: 13.5,
                            margin: 0,
                            fontWeight: 500,
                          }}
                        >
                          {a.text}
                        </p>
                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: 12,
                            margin: "3px 0 0",
                          }}
                        >
                          {a.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
