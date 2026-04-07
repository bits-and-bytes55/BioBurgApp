// adminpanel/MarketingAgent/AdminLeads.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const RESPONSE_STATUSES = [
  { value: "Responded - Positive", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: "Responded - Neutral",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "Responded - Negative", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { value: "No Response",          color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
  { value: "Callback Requested",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: "Order Placed",         color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { value: "Follow Up Required",   color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { value: "Not Available",        color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
];

const STATUS_PILL_STYLES = {
  pending:  { bg: "#FFF3CD", text: "#856404", border: "#FFEAA7" },
  approved: { bg: "#D4EDDA", text: "#155724", border: "#C3E6CB" },
  rejected: { bg: "#F8D7DA", text: "#721C24", border: "#F5C6CB" },
  paid:     { bg: "#CCE5FF", text: "#004085", border: "#B8DAFF" },
};

const getStatusStyle = (val) =>
  RESPONSE_STATUSES.find((s) => s.value === val) || { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };

const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export default function AdminLeads() {
  const [responses, setResponses]   = useState([]);
  const [agents, setAgents]         = useState([]);
  const [configs, setConfigs]       = useState([]);
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);

  // Filters
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter]   = useState("all");
  const [orderFilter, setOrderFilter]   = useState("all");
  const [page, setPage]               = useState(1);
  const LIMIT = 50;

  // Award points modal
  const [awardModal, setAwardModal]   = useState(null); // { response }
  const [awardTaskKey, setAwardTaskKey] = useState("");
  const [awardNote, setAwardNote]     = useState("");

  // Detail drawer
  const [detail, setDetail]           = useState(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(agentFilter !== "all" && { agentId: agentFilter }),
        ...(orderFilter === "yes" && { hasOrder: "true" }),
        ...(search && { search }),
      });

      const res = await axios.get(`${API}/api/points/admin/leads?${params}`, {
        headers: adminHeaders(),
      });
      setResponses(res.data.data || []);
      setTotal(res.data.total || 0);
      setStats(res.data.stats || {});
    } catch (err) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, agentFilter, orderFilter, search]);

  const fetchAgents = async () => {
    try {
      const res = await axios.get(`${API}/api/points/admin/agents`, { headers: adminHeaders() });
      setAgents(res.data.data || []);
    } catch {}
  };

  const fetchConfigs = async () => {
    try {
      const res = await axios.get(`${API}/api/points/admin/config`, { headers: adminHeaders() });
      setConfigs(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchResponses();
    fetchAgents();
    fetchConfigs();
  }, [fetchResponses]);

  const handleAwardPoints = async () => {
    if (!awardModal || !awardTaskKey) {
      toast.error("Select a task to award points for");
      return;
    }
    try {
      const cfg = configs.find((c) => c.taskKey === awardTaskKey);
      await axios.post(
        `${API}/api/points/admin/award`,
        {
          agentId: awardModal.response.agentId?._id || awardModal.response.agentId,
          taskKey: awardTaskKey,
          points: cfg?.points || 0,
          note: awardNote || `Manually awarded from lead: ${awardModal.response.placeName}`,
        },
        { headers: adminHeaders() }
      );
      toast.success(`${cfg?.points || 0} points awarded!`);
      setAwardModal(null);
      setAwardTaskKey("");
      setAwardNote("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to award points");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={S.page}>
      {/* ── HEADER ── */}
      <div style={S.headerRow}>
        <div>
          <h2 style={S.title}>🎯 Agent Leads</h2>
          <p style={S.subtitle}>All field responses logged by marketing agents</p>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={S.statsGrid}>
        {[
          { label: "Total Responses", value: stats.total ?? 0, color: "#6366f1" },
          { label: "Positive",        value: stats.positive ?? 0, color: "#16a34a" },
          { label: "Orders",          value: stats.orders ?? 0, color: "#7c3aed" },
          { label: "Follow Ups",      value: stats.followUp ?? 0, color: "#d97706" },
          { label: "No Response",     value: stats.noResponse ?? 0, color: "#ef4444" },
          { label: "Order Value",     value: `₹${(stats.orderValue || 0).toLocaleString("en-IN")}`, color: "#0ea5e9" },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, borderTopColor: s.color }}>
            <p style={S.statLabel}>{s.label}</p>
            <p style={{ ...S.statValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div style={S.filterRow}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search place, person, address, product..."
          style={S.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={S.select}
        >
          <option value="all">All Statuses</option>
          {RESPONSE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.value}</option>
          ))}
        </select>
        <select
          value={agentFilter}
          onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
          style={S.select}
        >
          <option value="all">All Agents</option>
          {agents.map((a) => (
            <option key={a.agentId} value={a.agentId}>{a.name} ({a.phone})</option>
          ))}
        </select>
        <select
          value={orderFilter}
          onChange={(e) => { setOrderFilter(e.target.value); setPage(1); }}
          style={S.select}
        >
          <option value="all">All Visits</option>
          <option value="yes">With Orders Only</option>
        </select>
      </div>

      {/* ── TABLE ── */}
      <div style={S.card}>
        {loading ? (
          <div style={S.loading}>Loading leads...</div>
        ) : responses.length === 0 ? (
          <div style={S.empty}>No leads found matching the current filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  {["Agent", "Place", "Type", "Contact", "Response", "Product", "Next Action", "Order", "Points", "Date", "Actions"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => {
                  const ss = getStatusStyle(r.responseStatus);
                  const agent = r.agentId;
                  return (
                    <tr
                      key={r._id}
                      style={S.tr}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Agent */}
                      <td style={S.td}>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{agent?.name || "—"}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{agent?.phone}</p>
                      </td>

                      {/* Place */}
                      <td style={S.td}>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{r.placeName}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.address || "—"}
                        </p>
                      </td>

                      {/* Type */}
                      <td style={S.td}>
                        <span style={S.chip}>{r.placeType}</span>
                      </td>

                      {/* Contact */}
                      <td style={S.td}>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{r.contactPerson}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{r.contactRole}</p>
                      </td>

                      {/* Response */}
                      <td style={S.td}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                          whiteSpace: "nowrap",
                        }}>
                          {r.responseStatus}
                        </span>
                      </td>

                      {/* Product */}
                      <td style={{ ...S.td, fontSize: 12, color: "#374151" }}>{r.productDiscussed || "—"}</td>

                      {/* Next Action */}
                      <td style={S.td}>
                        {r.nextAction && r.nextAction !== "None Required" ? (
                          <span style={{ ...S.chip, background: "#fff7ed", color: "#c2410c" }}>{r.nextAction}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                        )}
                      </td>

                      {/* Order */}
                      <td style={S.td}>
                        {r.hasOrder ? (
                          <div>
                            <span style={{ ...S.chip, background: "#f5f3ff", color: "#7c3aed", fontWeight: 800 }}>ORDER</span>
                            <p style={{ fontSize: 12, color: "#7c3aed", margin: "3px 0 0", fontWeight: 700 }}>
                              ₹{Number(r.orderValue || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                        )}
                      </td>

                      {/* Points awarded */}
                      <td style={S.td}>
                        {r.pointsAwarded ? (
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#10b981" }}>+{r.pointsAwarded}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ ...S.td, fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>

                      {/* Actions */}
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setDetail(r)}
                            style={S.viewBtn}
                          >
                            View
                          </button>
                          <button
                            onClick={() => setAwardModal({ response: r })}
                            style={S.awardBtn}
                          >
                            ⭐ Award
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={S.pagination}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={S.pageBtn}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "#374151" }}>
              Page {page} of {totalPages} ({total} total)
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={S.pageBtn}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── AWARD POINTS MODAL ── */}
      {awardModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: "0 0 4px" }}>⭐ Award Points</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
              For response at <strong>{awardModal.response.placeName}</strong>
              {" "}by <strong>{awardModal.response.agentId?.name}</strong>
            </p>

            <div style={S.formGroup}>
              <label style={S.label}>Select Task / Reason</label>
              <select
                value={awardTaskKey}
                onChange={(e) => setAwardTaskKey(e.target.value)}
                style={S.input}
              >
                <option value="">-- Select Task --</option>
                {configs.map((c) => (
                  <option key={c.taskKey} value={c.taskKey}>
                    {c.taskLabel} ({c.points} pts)
                  </option>
                ))}
              </select>
            </div>

            {awardTaskKey && (
              <div style={{ background: "#EEF2FF", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#4338ca" }}>
                This will award <strong>{configs.find((c) => c.taskKey === awardTaskKey)?.points || 0} points</strong> to the agent.
              </div>
            )}

            <div style={S.formGroup}>
              <label style={S.label}>Note (optional)</label>
              <input
                value={awardNote}
                onChange={(e) => setAwardNote(e.target.value)}
                placeholder="e.g. Exceptional follow-up..."
                style={S.input}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleAwardPoints} style={S.confirmBtn}>Award Points</button>
              <button onClick={() => { setAwardModal(null); setAwardTaskKey(""); setAwardNote(""); }} style={S.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL DRAWER ── */}
      {detail && (
        <div style={S.overlay} onClick={() => setDetail(null)}>
          <div style={{ ...S.modal, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>📋 Response Detail</h3>
              <button onClick={() => setDetail(null)} style={S.cancelBtn}>✕ Close</button>
            </div>

            {[
              ["Agent", `${detail.agentId?.name} (${detail.agentId?.phone})`],
              ["Place", detail.placeName],
              ["Type", detail.placeType],
              ["Address", detail.address || "—"],
              ["Contact Person", detail.contactPerson],
              ["Role", detail.contactRole || "—"],
              ["Phone", detail.phone || "—"],
              ["Response", detail.responseStatus],
              ["Product Discussed", detail.productDiscussed || "—"],
              ["Next Action", detail.nextAction],
              ["Follow Up Date", detail.followUpDate ? new Date(detail.followUpDate).toLocaleDateString("en-IN") : "—"],
              ["Has Order", detail.hasOrder ? "Yes" : "No"],
              ["Order Value", detail.hasOrder ? `₹${Number(detail.orderValue).toLocaleString("en-IN")}` : "—"],
              ["Points Awarded", detail.pointsAwarded ? `+${detail.pointsAwarded} pts` : "—"],
              ["Logged At", new Date(detail.createdAt).toLocaleString("en-IN")],
              ["Remarks", detail.remarks || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ width: 150, fontSize: 12, fontWeight: 700, color: "#6b7280", flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, color: "#111827" }}>{v}</span>
              </div>
            ))}

            <button
              onClick={() => { setAwardModal({ response: detail }); setDetail(null); }}
              style={{ ...S.confirmBtn, marginTop: 16, width: "100%" }}
            >
              ⭐ Award Points for This Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { padding: 24, fontFamily: "'Segoe UI', sans-serif" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 20 },
  statCard: { background: "#fff", border: "1px solid #e5e7eb", borderTopWidth: 3, borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  statLabel: { fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" },
  statValue: { fontSize: 22, fontWeight: 800, margin: 0 },
  filterRow: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 220, padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit" },
  select: { padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff", fontFamily: "inherit" },
  card: { background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", overflow: "hidden" },
  loading: { padding: "40px 20px", textAlign: "center", color: "#6b7280" },
  empty: { padding: "40px 20px", textAlign: "center", color: "#9ca3af" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6", transition: "background 0.1s" },
  td: { padding: "12px 14px", fontSize: 13, color: "#374151", verticalAlign: "middle" },
  chip: { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: "#475569" },
  viewBtn: { padding: "5px 12px", background: "#EEF2FF", color: "#6366f1", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 },
  awardBtn: { padding: "5px 12px", background: "#FFFBEB", color: "#d97706", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: 16, padding: "16px 20px", borderTop: "1px solid #f3f4f6" },
  pageBtn: { padding: "6px 16px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" },
  formGroup: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 700, color: "#374151" },
  input: { padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit" },
  confirmBtn: { padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  cancelBtn: { padding: "10px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 },
};