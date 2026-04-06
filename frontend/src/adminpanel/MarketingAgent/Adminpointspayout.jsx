import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STATUS_COLORS = {
  pending: { bg: "#FFF3CD", text: "#856404", border: "#FFEAA7" },
  approved: { bg: "#D4EDDA", text: "#155724", border: "#C3E6CB" },
  rejected: { bg: "#F8D7DA", text: "#721C24", border: "#F5C6CB" },
  paid: { bg: "#CCE5FF", text: "#004085", border: "#B8DAFF" },
};

const DEFAULT_CONFIGS = [
  { taskKey: "lead_submitted", taskLabel: "Lead Submitted", points: 10, description: "Agent submits a new lead" },
  { taskKey: "order_placed", taskLabel: "Order Placed", points: 20, description: "Agent places an order" },
  { taskKey: "order_delivered", taskLabel: "Order Delivered", points: 30, description: "Assigned order delivered" },
  { taskKey: "response_submitted", taskLabel: "Response Submitted", points: 5, description: "Agent submits a response" },
  { taskKey: "attendance_marked", taskLabel: "Attendance Marked", points: 5, description: "Daily attendance" },
  { taskKey: "training_completed", taskLabel: "Training Completed", points: 50, description: "Completes a training module" },
  { taskKey: "campaign_joined", taskLabel: "Campaign Joined", points: 15, description: "Joins a campaign" },
];

export default function AdminPointsPayout() {
  const [tab, setTab] = useState("payouts"); // payouts | config | agents | award
  const [payouts, setPayouts] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Payout action modal
  const [actionModal, setActionModal] = useState(null); // { payout, action }
  const [actionNote, setActionNote] = useState("");
  const [txnId, setTxnId] = useState("");

  // Award modal
  const [awardModal, setAwardModal] = useState(false);
  const [awardForm, setAwardForm] = useState({ agentId: "", taskKey: "", points: "", note: "" });

  // Config edit
  const [editingConfig, setEditingConfig] = useState(null);
  const [newConfig, setNewConfig] = useState({ taskKey: "", taskLabel: "", points: "", description: "" });
  const [addingConfig, setAddingConfig] = useState(false);

  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, c, a] = await Promise.all([
        axios.get(`${API}/api/points/admin/payouts`, { headers }),
        axios.get(`${API}/api/points/admin/config`, { headers }),
        axios.get(`${API}/api/points/admin/agents`, { headers }),
      ]);
      setPayouts(p.data.data);
      setConfigs(c.data.data.length ? c.data.data : DEFAULT_CONFIGS);
      setAgents(a.data.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutAction = async () => {
    if (!actionModal) return;
    try {
      await axios.patch(
        `${API}/api/points/admin/payouts/${actionModal.payout._id}`,
        { status: actionModal.action, adminNote: actionNote, transactionId: txnId },
        { headers }
      );
      toast.success(`Payout ${actionModal.action}!`);
      setActionModal(null); setActionNote(""); setTxnId("");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const handleSaveConfig = async (cfg) => {
    try {
      await axios.post(`${API}/api/points/admin/config`, cfg, { headers });
      toast.success("Config saved!");
      setEditingConfig(null); setAddingConfig(false);
      setNewConfig({ taskKey: "", taskLabel: "", points: "", description: "" });
      fetchAll();
    } catch (err) {
      toast.error("Failed to save config");
    }
  };

  const handleAward = async () => {
    try {
      await axios.post(`${API}/api/points/admin/award`, {
        ...awardForm, points: Number(awardForm.points),
      }, { headers });
      toast.success("Points awarded!");
      setAwardModal(false);
      setAwardForm({ agentId: "", taskKey: "", points: "", note: "" });
      fetchAll();
    } catch (err) {
      toast.error("Failed to award points");
    }
  };

  const filteredPayouts = statusFilter === "all"
    ? payouts
    : payouts.filter((p) => p.status === statusFilter);

  const stats = {
    total: payouts.length,
    pending: payouts.filter((p) => p.status === "pending").length,
    paid: payouts.filter((p) => p.status === "paid").length,
    totalAmount: payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountRequested, 0),
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>🏆 Points & Payout Management</h2>
          <p style={styles.subtitle}>Manage agent rewards, payout requests, and points configuration</p>
        </div>
        <button onClick={() => setAwardModal(true)} style={styles.awardBtn}>
          ⭐ Award Points
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <MiniStat label="Total Requests" value={stats.total} color="#6366f1" />
        <MiniStat label="Pending" value={stats.pending} color="#f59e0b" />
        <MiniStat label="Paid Out" value={stats.paid} color="#10b981" />
        <MiniStat label="Total Paid" value={`₹${stats.totalAmount.toLocaleString()}`} color="#3b82f6" />
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {[
          { id: "payouts", label: "💸 Payout Requests" },
          { id: "config", label: "⚙️ Points Config" },
          { id: "agents", label: "👥 Agent Points" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ ...styles.tab, ...(tab === t.id ? styles.tabActive : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PAYOUTS TAB ── */}
      {tab === "payouts" && (
        <div style={styles.card}>
          <div style={styles.filterRow}>
            {["all", "pending", "approved", "paid", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  ...styles.filterBtn,
                  ...(statusFilter === s ? styles.filterBtnActive : {}),
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {filteredPayouts.length === 0 ? (
            <div style={styles.empty}>No payout requests found.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Agent</th>
                    <th style={styles.th}>Points</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Payment Details</th>
                    <th style={styles.th}>Requested</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((p) => {
                    const sc = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
                    const bd = p.bankDetails || {};
                    return (
                      <tr key={p._id} style={styles.tr}>
                        <td style={styles.td}>
                          <p style={{ fontWeight: 700, margin: 0 }}>{p.agentName || p.agentId?.name}</p>
                          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{p.agentPhone || p.agentId?.phone}</p>
                        </td>
                        <td style={{ ...styles.td, fontWeight: 700, color: "#6366f1" }}>{p.pointsRedeemed}</td>
                        <td style={{ ...styles.td, fontWeight: 700, color: "#10b981" }}>₹{p.amountRequested}</td>
                        <td style={styles.td}>
                          {bd.upiId ? (
                            <p style={{ fontSize: 13, margin: 0 }}>UPI: {bd.upiId}</p>
                          ) : (
                            <>
                              <p style={{ fontSize: 12, margin: 0 }}>{bd.bankName}</p>
                              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>****{bd.accountNumber?.slice(-4)}</p>
                              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{bd.ifsc}</p>
                            </>
                          )}
                        </td>
                        <td style={{ ...styles.td, fontSize: 12, color: "#6b7280" }}>
                          {new Date(p.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 20,
                            fontSize: 11, fontWeight: 700,
                            background: sc.bg, color: sc.text,
                            border: `1px solid ${sc.border}`,
                            textTransform: "uppercase",
                          }}>
                            {p.status}
                          </span>
                          {p.transactionId && (
                            <p style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                              Txn: {p.transactionId}
                            </p>
                          )}
                        </td>
                        <td style={styles.td}>
                          {p.status === "pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => setActionModal({ payout: p, action: "approved" })}
                                style={styles.approveBtn}
                              >✓ Approve</button>
                              <button
                                onClick={() => setActionModal({ payout: p, action: "rejected" })}
                                style={styles.rejectBtn}
                              >✗ Reject</button>
                            </div>
                          )}
                          {p.status === "approved" && (
                            <button
                              onClick={() => setActionModal({ payout: p, action: "paid" })}
                              style={styles.paidBtn}
                            >💳 Mark Paid</button>
                          )}
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
        <div style={styles.card}>
          <div style={styles.configHeader}>
            <h3 style={styles.sectionTitle}>Points per Task</h3>
            <button onClick={() => setAddingConfig(true)} style={styles.addBtn}>
              + Add Task
            </button>
          </div>

          {addingConfig && (
            <div style={styles.configForm}>
              <h4 style={{ margin: "0 0 12px", color: "#374151" }}>New Task Config</h4>
              <div style={styles.configRow}>
                <input value={newConfig.taskKey} onChange={(e) => setNewConfig({ ...newConfig, taskKey: e.target.value })} placeholder="Task Key (e.g. lead_submitted)" style={styles.input} />
                <input value={newConfig.taskLabel} onChange={(e) => setNewConfig({ ...newConfig, taskLabel: e.target.value })} placeholder="Label" style={styles.input} />
                <input type="number" value={newConfig.points} onChange={(e) => setNewConfig({ ...newConfig, points: e.target.value })} placeholder="Points" style={{ ...styles.input, width: 90 }} />
                <input value={newConfig.description} onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })} placeholder="Description" style={styles.input} />
                <button onClick={() => handleSaveConfig({ ...newConfig, points: Number(newConfig.points) })} style={styles.approveBtn}>Save</button>
                <button onClick={() => setAddingConfig(false)} style={styles.rejectBtn}>Cancel</button>
              </div>
            </div>
          )}

          <div style={styles.configList}>
            {configs.map((cfg) => (
              <div key={cfg.taskKey} style={styles.configItem}>
                {editingConfig?.taskKey === cfg.taskKey ? (
                  <div style={styles.configRow}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", minWidth: 160 }}>{cfg.taskKey}</span>
                    <input value={editingConfig.taskLabel} onChange={(e) => setEditingConfig({ ...editingConfig, taskLabel: e.target.value })} style={styles.input} />
                    <input type="number" value={editingConfig.points} onChange={(e) => setEditingConfig({ ...editingConfig, points: Number(e.target.value) })} style={{ ...styles.input, width: 90 }} />
                    <input value={editingConfig.description || ""} onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })} style={styles.input} placeholder="Description" />
                    <button onClick={() => handleSaveConfig(editingConfig)} style={styles.approveBtn}>Save</button>
                    <button onClick={() => setEditingConfig(null)} style={styles.rejectBtn}>Cancel</button>
                  </div>
                ) : (
                  <div style={styles.configRow}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: "#111827", margin: 0 }}>{cfg.taskLabel}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", fontFamily: "monospace" }}>{cfg.taskKey}</p>
                      {cfg.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{cfg.description}</p>}
                    </div>
                    <div style={styles.pointsBadge}>⭐ {cfg.points} pts</div>
                    <button onClick={() => setEditingConfig({ ...cfg })} style={styles.editBtn}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AGENTS TAB ── */}
      {tab === "agents" && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Agent Points Summary</h3>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Agent</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Total Points</th>
                  <th style={styles.th}>Cash Value</th>
                  <th style={styles.th}>Transactions</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.agentId} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{a.name || "—"}</td>
                    <td style={styles.td}>{a.phone || "—"}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: "#6366f1", fontSize: 18 }}>{a.totalPoints}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#10b981" }}>₹{a.totalPoints}</td>
                    <td style={{ ...styles.td, color: "#6b7280" }}>{a.entries}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => { setAwardForm({ ...awardForm, agentId: a.agentId }); setAwardModal(true); }}
                        style={styles.approveBtn}
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
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 16px" }}>
              {actionModal.action === "approved" ? "✅ Approve Payout" :
               actionModal.action === "rejected" ? "❌ Reject Payout" :
               "💳 Mark as Paid"}
            </h3>
            <p style={{ fontSize: 14, color: "#374151" }}>
              Agent: <strong>{actionModal.payout.agentName}</strong> — ₹{actionModal.payout.amountRequested}
            </p>
            {actionModal.action === "paid" && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Transaction ID</label>
                <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="Enter transaction ID" style={styles.input} />
              </div>
            )}
            <div style={styles.formGroup}>
              <label style={styles.label}>Admin Note (optional)</label>
              <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Add a note..." style={{ ...styles.input, minHeight: 70, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handlePayoutAction} style={styles.approveBtn}>Confirm</button>
              <button onClick={() => { setActionModal(null); setActionNote(""); setTxnId(""); }} style={styles.rejectBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AWARD MODAL ── */}
      {awardModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 16px" }}>⭐ Award Points to Agent</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Agent</label>
                <select value={awardForm.agentId} onChange={(e) => setAwardForm({ ...awardForm, agentId: e.target.value })} style={styles.input}>
                  <option value="">-- Select Agent --</option>
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>{a.name} ({a.phone})</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Task</label>
                <select value={awardForm.taskKey} onChange={(e) => setAwardForm({ ...awardForm, taskKey: e.target.value })} style={styles.input}>
                  <option value="">-- Select Task --</option>
                  {configs.map((c) => (
                    <option key={c.taskKey} value={c.taskKey}>{c.taskLabel} ({c.points} pts)</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Points</label>
                <input type="number" value={awardForm.points} onChange={(e) => setAwardForm({ ...awardForm, points: e.target.value })} placeholder="Points to award" style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Note</label>
                <input value={awardForm.note} onChange={(e) => setAwardForm({ ...awardForm, note: e.target.value })} placeholder="Reason" style={styles.input} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleAward} style={styles.approveBtn}>Award Points</button>
              <button onClick={() => setAwardModal(false)} style={styles.rejectBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: "#fff", border: `2px solid ${color}22`, borderRadius: 12, padding: "14px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{value}</p>
    </div>
  );
}

const styles = {
  page: { padding: 24, fontFamily: "'Segoe UI', sans-serif" },
  loading: { padding: 40, textAlign: "center", color: "#6b7280" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  awardBtn: { padding: "10px 20px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 20 },
  tabBar: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e5e7eb", paddingBottom: 0 },
  tab: { padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#6b7280", borderBottom: "3px solid transparent", marginBottom: -2, borderRadius: "8px 8px 0 0", transition: "all 0.15s" },
  tabActive: { color: "#6366f1", borderBottomColor: "#6366f1", background: "#EEF2FF" },
  card: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" },
  filterRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  filterBtn: { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6b7280" },
  filterBtnActive: { background: "#EEF2FF", color: "#6366f1", borderColor: "#6366f1" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 14px", fontSize: 13, color: "#374151", verticalAlign: "middle" },
  approveBtn: { padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 },
  rejectBtn: { padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 },
  paidBtn: { padding: "6px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 },
  editBtn: { padding: "5px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 },
  addBtn: { padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 },
  configHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 },
  configForm: { background: "#f9fafb", borderRadius: 10, padding: 16, marginBottom: 16 },
  configList: { display: "flex", flexDirection: "column", gap: 1 },
  configItem: { padding: "14px 0", borderBottom: "1px solid #f3f4f6" },
  configRow: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  pointsBadge: { background: "#EEF2FF", color: "#6366f1", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" },
  input: { padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit", flex: 1, minWidth: 100 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151" },
  empty: { textAlign: "center", padding: "40px 20px", color: "#9ca3af" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
};