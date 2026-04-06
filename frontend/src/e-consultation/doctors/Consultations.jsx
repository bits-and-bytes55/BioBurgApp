import React, { useEffect, useState } from "react";
import api from "./doctorApi";

const card = {
  background: "#ffffff",
  borderRadius: 16,
  padding: "20px 24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  border: "1px solid #e2e8f0",
};

const statusConfig = {
  pending: { label: "Pending", bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
  completed: { label: "Completed", bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
};

const FILTERS = ["All", "Pending", "Completed", "Cancelled"];
const avatarColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#16a34a"];

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConsultations(); }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/doctor/consultations");
      setConsultations(res.data.data || []);
    }
      catch (err) {
  console.error(err);
  setConsultations([]);
} finally {
    setLoading(false);
  }
}; 

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/doctor/consultations/${id}/status`, { status });
      setConsultations((prev) => prev.map((c) => c._id === id ? { ...c, status } : c));
    } catch {
      alert("Failed to update status");
    }
  };

  const filtered = filter === "All" ? consultations : consultations.filter((c) => c.status === filter.toLowerCase());

  const counts = {
    All: consultations.length,
    Pending: consultations.filter((c) => c.status === "pending").length,
    Completed: consultations.filter((c) => c.status === "completed").length,
    Cancelled: consultations.filter((c) => c.status === "cancelled").length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#0f172a", fontSize: 24, fontWeight: 700, margin: 0 }}>Consultations</h1>
        <p style={{ color: "#64748b", fontSize: 13.5, margin: "4px 0 0" }}>Manage and track all patient consultations</p>
      </div>

      {/* Summary Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total", count: counts.All, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Pending", count: counts.Pending, color: "#d97706", bg: "#fef3c7" },
          { label: "Completed", count: counts.Completed, color: "#16a34a", bg: "#dcfce7" },
          { label: "Cancelled", count: counts.Cancelled, color: "#dc2626", bg: "#fee2e2" },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <div>
              <p style={{ color: "#64748b", fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
              <p style={{ color: "#0f172a", fontSize: 22, fontWeight: 700, margin: "2px 0 0" }}>{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: filter === f ? "none" : "1.5px solid #e2e8f0",
              background: filter === f ? "#0f172a" : "#fff",
              color: filter === f ? "#fff" : "#64748b",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f} {counts[f] !== undefined ? `(${counts[f]})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Loading consultations...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <p style={{ color: "#64748b", fontSize: 15, fontWeight: 500 }}>No {filter.toLowerCase()} consultations found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c, i) => {
            const status = statusConfig[c.status] || statusConfig.pending;
            const initials = c.patientName?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            // const typeIcon = { "Video Call": "", "In-Person": "", Chat: "" };
            return (
              <div
                key={c._id}
                style={{
                  ...card,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: avatarColors[i % avatarColors.length],
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>
  <p style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: 0 }}>
    {c.patientName}
  </p>

  <p style={{ color: "#64748b", fontSize: 13, margin: "3px 0 0" }}>
     {c.patientMobile || "No phone"}
  </p>

  <p style={{ color: "#64748b", fontSize: 13, margin: "3px 0 0" }}>
    {new Date(c.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })} • {c.time}
    <span style={{ marginLeft: 8, fontWeight: 600 }}>
      • {c.mode}
    </span>
  </p>
</div>
                  <p style={{ color: "#64748b", fontSize: 13, margin: "3px 0 0" }}>
                    {new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {c.time}
                    {/* {c.type && <span style={{ marginLeft: 8 }}>{typeIcon[c.type] || ""} {c.type}</span>} */}
                  </p>
                </div>

                {/* Status Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 100, background: status.bg }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.dot }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: status.color }}>{status.label}</span>
                </div>

                {/* Actions */}
                {c.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {c.patientMobile && (
  <a
    href={`tel:${c.patientMobile}`}
    style={{
      padding: "8px 14px",
      borderRadius: 10,
      background: "#2563eb",
      color: "#fff",
      fontWeight: 600,
      fontSize: 13,
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: 5,
    }}
  >
    Call
  </a>
)}
                    <button
                      onClick={() => updateStatus(c._id, "completed")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "#16a34a",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Complete
                    </button>
                    <button
                      onClick={() => updateStatus(c._id, "cancelled")}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #fecaca",
                        background: "#fff",
                        color: "#dc2626",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Consultations;
