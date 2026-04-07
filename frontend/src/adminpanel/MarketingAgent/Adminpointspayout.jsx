// adminpanel/MarketingAgent/AdminPointsPayout.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STATUS_META = {
  pending:  { bg: "#FFF3CD", text: "#856404", border: "#FFEAA7" },
  approved: { bg: "#D4EDDA", text: "#155724", border: "#C3E6CB" },
  rejected: { bg: "#F8D7DA", text: "#721C24", border: "#F5C6CB" },
  paid:     { bg: "#CCE5FF", text: "#004085", border: "#B8DAFF" },
};

const DEFAULT_TASK_CONFIGS = [
  { taskKey: "response_submitted",  taskLabel: "Response Submitted",  points: 5,  description: "Agent logs a field visit response" },
  { taskKey: "lead_submitted",      taskLabel: "Lead Submitted",       points: 10, description: "Agent logs a positive response" },
  { taskKey: "order_placed",        taskLabel: "Order Placed",         points: 20, description: "Order received at a visit" },
  { taskKey: "order_delivered",     taskLabel: "Order Delivered",      points: 30, description: "Assigned order delivered" },
  { taskKey: "attendance_marked",   taskLabel: "Attendance Marked",    points: 5,  description: "Daily attendance" },
  { taskKey: "training_completed",  taskLabel: "Training Completed",   points: 50, description: "Completes a training module" },
  { taskKey: "campaign_joined",     taskLabel: "Campaign Joined",      points: 15, description: "Joins a campaign" },
];

const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export default function AdminPointsPayout() {
  const [tab, setTab]         = useState("payouts");
  const [payouts, setPayouts] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Action modal (approve/reject/paid)
  const [actionModal, setActionModal] = useState(null);
  const [actionNote, setActionNote]   = useState("");
  const [txnId, setTxnId]             = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Award modal
  const [awardModal, setAwardModal]     = useState(false);
  const [awardForm, setAwardForm]       = useState({ agentId: "", taskKey: "", points: "", note: "" });

  // Config editing
  const [editingConfig, setEditingConfig] = useState(null);
  const [addingConfig, setAddingConfig]   = useState(false);
  const [newConfig, setNewConfig]         = useState({ taskKey: "", taskLabel: "", points: "", description: "" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, a] = await Promise.all([
        axios.get(`${API}/api/points/admin/payouts`, { headers: adminHeaders() }),
        axios.get(`${API}/api/points/admin/config`,  { headers: adminHeaders() }),
        axios.get(`${API}/api/points/admin/agents`,  { headers: adminHeaders() }),
      ]);
      setPayouts(p.data.data || []);
      setConfigs(c.data.data?.length ? c.data.data : DEFAULT_TASK_CONFIGS);
      setAgents(a.data.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Seed default configs on first load if none exist
  const seedDefaults = async () => {
    try {
      await Promise.all(
        DEFAULT_TASK_CONFIGS.map((cfg) =>
          axios.post(`${API}/api/points/admin/config`, cfg, { headers: adminHeaders() })
        )
      );
      toast.success("Default configs seeded!");
      fetchAll();
    } catch {
      toast.error("Failed to seed configs");
    }
  };

  const handlePayoutAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await axios.patch(
        `${API}/api/points/admin/payouts/${actionModal.payout._id}`,
        { status: actionModal.action, adminNote: actionNote, transactionId: txnId },
        { headers: adminHeaders() }
      );
      toast.success(`Payout ${actionModal.action} successfully!`);
      setActionModal(null); setActionNote(""); setTxnId("");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveConfig = async (cfg) => {
    try {
      await axios.post(`${API}/api/points/admin/config`, {
        ...cfg, points: Number(cfg.points),
      }, { headers: adminHeaders() });
      toast.success("Config saved!");
      setEditingConfig(null); setAddingConfig(false);
      setNewConfig({ taskKey: "", taskLabel: "", points: "", description: "" });
      fetchAll();
    } catch {
      toast.error("Failed to save config");
    }
  };

  const handleDeleteConfig = async (taskKey) => {
    if (!window.confirm(`Delete config for "${taskKey}"?`)) return;
    try {
      await axios.delete(`${API}/api/points/admin/config/${taskKey}`, { headers: adminHeaders() });
      toast.success("Config deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAward = async () => {
    if (!awardForm.agentId || !awardForm.taskKey || !awardForm.points) {
      toast.error("Fill all fields");
      return;
    }
    try {
      await axios.post(`${API}/api/points/admin/award`, {
        ...awardForm, points: Number(awardForm.points),
      }, { headers: adminHeaders() });
      toast.success("Points awarded!");
      setAwardModal(false);
      setAwardForm({ agentId: "", taskKey: "", points: "", note: "" });
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to award");
    }
  };

  const filteredPayouts = statusFilter === "all"
    ? payouts
    : payouts.filter((p) => p.status === statusFilter);

  const stats = {
    total: payouts.length,
    pending: payouts.filter((p) => p.status === "pending").length,
    approved: payouts.filter((p) => p.status === "approved").length,
    paid: payouts.filter((p) => p.status === "paid").length,
    rejected: payouts.filter((p) => p.status === "rejected").length,
    totalPaidAmt: payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountRequested, 0),
  };

  if (loading) return <div style={S.loading}>Loading...</div>;

  return (
    <div style={S.page}>
      {/* ── HEADER ── */}
      <div style={S.headerRow}>
        <div>
          <h2 style={S.title}>🏆 Points & Payout Management</h2>
          <p style={S.subtitle}>Manage agent rewards, payout requests, and points configuration</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setAwardModal(true)} style={S.awardBtn}>⭐ Award Points</button>
          {configs.length === 0 && (
            <button onClick={seedDefaults} style={{ ...S.awardBtn, background: "#10b981" }}>🌱 Seed Defaults</button>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={S.statsGrid}>
        {[
          { label: "Total Requests", value: stats.total,      color: "#6366f1" },
          { label: "Pending",        value: stats.pending,    color: "#f59e0b" },
          { label: "Approved",       value: stats.approved,   color: "#3b82f6" },
          { label: "Paid",           value: stats.paid,       color: "#10b981" },
          { label: "Rejected",       value: stats.rejected,   color: "#ef4444" },
          { label: "Total Paid",     value: `₹${stats.totalPaidAmt.toLocaleString("en-IN")}`, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, borderTopColor: s.color }}>
            <p style={S.statLabel}>{s.label}</p>
            <p style={{ ...S.statValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={S.tabBar}>
        {[
          { id: "payouts", label: "💸 Payout Requests" },
          { id: "config",  label: "⚙️ Points Config" },
          { id: "agents",  label: "👥 Agent Leaderboard" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PAYOUTS TAB ── */}
      {tab === "payouts" && (
        <div style={S.card}>
          <div style={S.filterRow}>
            {["all", "pending", "approved", "paid", "rejected"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ ...S.filterBtn, ...(statusFilter === s ? S.filterBtnActive : {}) }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {" "}({s === "all" ? payouts.length : payouts.filter((p) => p.status === s).length})
              </button>
            ))}
          </div>

          {filteredPayouts.length === 0 ? (
            <div style={S.empty}>No payout requests found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr style={S.thead}>
                    {["Agent", "Points", "Amount", "Payment Info", "Requested", "Status", "Actions"].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((p) => {
                    const sc = STATUS_META[p.status] || STATUS_META.pending;
                    const bd = p.bankDetails || {};
                    const agent = p.agentId;
                    return (
                      <tr key={p._id} style={S.tr}>
                        <td style={S.td}>
                          <p style={{ fontWeight: 700, margin: 0 }}>{p.agentName || agent?.name || "—"}</p>
                          <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{p.agentPhone || agent?.phone}</p>
                        </td>
                        <td style={{ ...S.td, fontWeight: 800, color: "#6366f1", fontSize: 18 }}>{p.pointsRedeemed}</td>
                        <td style={{ ...S.td, fontWeight: 800, color: "#10b981" }}>₹{p.amountRequested.toFixed(2)}</td>
                        <td style={S.td}>
                          {bd.upiId ? (
                            <p style={{ fontSize: 13, margin: 0 }}>UPI: {bd.upiId}</p>
                          ) : (
                            <>
                              <p style={{ fontSize: 12, margin: 0, fontWeight: 600 }}>{bd.bankName}</p>
                              <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>A/C ****{bd.accountNumber?.slice(-4)}</p>
                              <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{bd.ifsc}</p>
                            </>
                          )}
                        </td>
                        <td style={{ ...S.td, fontSize: 12, color: "#6b7280" }}>
                          {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td style={S.td}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, textTransform: "uppercase" }}>
                            {p.status}
                          </span>
                          {p.transactionId && <p style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Txn: {p.transactionId}</p>}
                          {p.adminNote && <p style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>Note: {p.adminNote}</p>}
                        </td>
                        <td style={S.td}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {p.status === "pending" && (
                              <>
                                <button onClick={() => setActionModal({ payout: p, action: "approved" })} style={S.approveBtn}>✓ Approve</button>
                                <button onClick={() => setActionModal({ payout: p, action: "rejected" })} style={S.rejectBtn}>✗ Reject</button>
                              </>
                            )}
                            {p.status === "approved" && (
                              <button onClick={() => setActionModal({ payout: p, action: "paid" })} style={S.paidBtn}>💳 Mark Paid</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONFIG TAB ── */}
      {tab === "config" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Points Per Task</h3>
            <button onClick={() => setAddingConfig(true)} style={S.approveBtn}>+ Add Task</button>
          </div>

          {addingConfig && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 12px", color: "#374151" }}>New Task Config</h4>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={S.formGroup}>
                  <label style={S.label}>Task Key</label>
                  <input value={newConfig.taskKey} onChange={(e) => setNewConfig({ ...newConfig, taskKey: e.target.value })} placeholder="e.g. lead_submitted" style={S.input} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Label</label>
                  <input value={newConfig.taskLabel} onChange={(e) => setNewConfig({ ...newConfig, taskLabel: e.target.value })} placeholder="Lead Submitted" style={S.input} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Points</label>
                  <input type="number" value={newConfig.points} onChange={(e) => setNewConfig({ ...newConfig, points: e.target.value })} placeholder="10" style={{ ...S.input, width: 80 }} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Description</label>
                  <input value={newConfig.description} onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })} placeholder="When to award..." style={S.input} />
                </div>
                <button onClick={() => handleSaveConfig(newConfig)} style={S.approveBtn}>Save</button>
                <button onClick={() => setAddingConfig(false)} style={S.rejectBtn}>Cancel</button>
              </div>
            </div>
          )}

          <div>
            {configs.map((cfg) => (
              <div key={cfg.taskKey} style={{ padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
                {editingConfig?.taskKey === cfg.taskKey ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#6b7280", alignSelf: "center", minWidth: 160 }}>{cfg.taskKey}</span>
                    <input value={editingConfig.taskLabel} onChange={(e) => setEditingConfig({ ...editingConfig, taskLabel: e.target.value })} style={S.input} />
                    <input type="number" value={editingConfig.points} onChange={(e) => setEditingConfig({ ...editingConfig, points: Number(e.target.value) })} style={{ ...S.input, width: 80 }} />
                    <input value={editingConfig.description || ""} onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })} placeholder="Description" style={S.input} />
                    <button onClick={() => handleSaveConfig(editingConfig)} style={S.approveBtn}>Save</button>
                    <button onClick={() => setEditingConfig(null)} style={S.rejectBtn}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontWeight: 700, color: "#111827", margin: 0 }}>{cfg.taskLabel}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", fontFamily: "monospace" }}>{cfg.taskKey}</p>
                      {cfg.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{cfg.description}</p>}
                    </div>
                    <div style={{ background: "#EEF2FF", color: "#6366f1", padding: "4px 14px", borderRadius: 20, fontSize: 14, fontWeight: 800 }}>
                      ⭐ {cfg.points} pts
                    </div>
                    <button onClick={() => setEditingConfig({ ...cfg })} style={{ padding: "5px 12px", background: "#FFFBEB", color: "#d97706", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Edit</button>
                    <button onClick={() => handleDeleteConfig(cfg.taskKey)} style={{ padding: "5px 12px", background: "#FEF2F2", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AGENTS TAB ── */}
      {tab === "agents" && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Agent Points Leaderboard</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  {["#", "Agent", "Phone", "Balance", "Total Earned", "Total Redeemed", "Last Activity", "Action"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a, i) => (
                  <tr key={a.agentId} style={S.tr}>
                    <td style={{ ...S.td, fontWeight: 700, color: "#6366f1" }}>#{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{a.name || "—"}</td>
                    <td style={S.td}>{a.phone || "—"}</td>
                    <td style={{ ...S.td, fontWeight: 800, color: "#10b981", fontSize: 18 }}>{a.totalPoints}</td>
                    <td style={{ ...S.td, color: "#6366f1", fontWeight: 700 }}>{a.totalEarned}</td>
                    <td style={{ ...S.td, color: "#ef4444", fontWeight: 700 }}>{a.totalRedeemed}</td>
                    <td style={{ ...S.td, fontSize: 12, color: "#6b7280" }}>
                      {a.lastActivity ? new Date(a.lastActivity).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td style={S.td}>
                      <button
                        onClick={() => { setAwardForm({ ...awardForm, agentId: a.agentId }); setAwardModal(true); }}
                        style={S.approveBtn}
                      >
                        ⭐ Award
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ACTION MODAL ── */}
      {actionModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: "0 0 4px" }}>
              {actionModal.action === "approved" ? "✅ Approve Payout" :
               actionModal.action === "rejected" ? "❌ Reject Payout" : "💳 Mark as Paid"}
            </h3>
            <p style={{ fontSize: 13, color: "#374151", margin: "0 0 20px" }}>
              <strong>{actionModal.payout.agentName}</strong> — ₹{actionModal.payout.amountRequested.toFixed(2)} ({actionModal.payout.pointsRedeemed} pts)
            </p>

            {actionModal.action === "paid" && (
              <div style={S.formGroup}>
                <label style={S.label}>Transaction ID *</label>
                <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="UTR / TXN number" style={S.input} />
              </div>
            )}

            <div style={S.formGroup}>
              <label style={S.label}>Admin Note {actionModal.action === "rejected" ? "(required)" : "(optional)"}</label>
              <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Add a note..." style={{ ...S.input, minHeight: 80, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handlePayoutAction} disabled={actionLoading} style={{ ...S.approveBtn, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
              <button onClick={() => { setActionModal(null); setActionNote(""); setTxnId(""); }} style={S.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AWARD MODAL ── */}
      {awardModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ margin: "0 0 16px" }}>⭐ Manually Award Points</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={S.formGroup}>
                <label style={S.label}>Select Agent *</label>
                <select value={awardForm.agentId} onChange={(e) => setAwardForm({ ...awardForm, agentId: e.target.value })} style={S.input}>
                  <option value="">-- Select Agent --</option>
                  {agents.map((a) => <option key={a.agentId} value={a.agentId}>{a.name} ({a.phone})</option>)}
                </select>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Task *</label>
                <select
                  value={awardForm.taskKey}
                  onChange={(e) => {
                    const cfg = configs.find((c) => c.taskKey === e.target.value);
                    setAwardForm({ ...awardForm, taskKey: e.target.value, points: cfg?.points?.toString() || "" });
                  }}
                  style={S.input}
                >
                  <option value="">-- Select Task --</option>
                  {configs.map((c) => <option key={c.taskKey} value={c.taskKey}>{c.taskLabel} ({c.points} pts)</option>)}
                </select>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Points *</label>
                <input type="number" value={awardForm.points} onChange={(e) => setAwardForm({ ...awardForm, points: e.target.value })} placeholder="Custom points amount" style={S.input} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Note</label>
                <input value={awardForm.note} onChange={(e) => setAwardForm({ ...awardForm, note: e.target.value })} placeholder="Reason for awarding..." style={S.input} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleAward} style={S.approveBtn}>Award Points</button>
              <button onClick={() => setAwardModal(false)} style={S.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { padding: 24, fontFamily: "'Segoe UI', sans-serif" },
  loading: { padding: 40, textAlign: "center", color: "#6b7280" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  awardBtn: { padding: "10px 20px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 20 },
  statCard: { background: "#fff", border: "1px solid #e5e7eb", borderTopWidth: 3, borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  statLabel: { fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" },
  statValue: { fontSize: 22, fontWeight: 800, margin: 0 },
  tabBar: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e5e7eb" },
  tab: { padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#6b7280", borderBottom: "3px solid transparent", marginBottom: -2, borderRadius: "8px 8px 0 0", transition: "all 0.15s", fontFamily: "inherit" },
  tabActive: { color: "#6366f1", borderBottomColor: "#6366f1", background: "#EEF2FF" },
  card: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" },
  filterRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  filterBtn: { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6b7280", fontFamily: "inherit" },
  filterBtnActive: { background: "#EEF2FF", color: "#6366f1", borderColor: "#6366f1" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 14px", fontSize: 13, color: "#374151", verticalAlign: "middle" },
  approveBtn: { padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" },
  rejectBtn: { padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" },
  paidBtn: { padding: "6px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" },
  cancelBtn: { padding: "10px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  empty: { padding: "40px 20px", textAlign: "center", color: "#9ca3af" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: "#374151" },
  input: { padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit" },
};