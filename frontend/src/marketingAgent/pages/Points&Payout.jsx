import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const RATE = 1; // 1 point = ₹1

const TASK_ICONS = {
  lead_submitted: "",
  order_placed: "",
  order_delivered: "",
  response_submitted: "",
  attendance_marked: "",
  training_completed: "",
  campaign_joined: "",
  payout_request: "",
  payout_refund: "",
  default: "",
};

const STATUS_COLORS = {
  pending: { bg: "#FFF3CD", text: "#856404", border: "#FFEAA7" },
  approved: { bg: "#D4EDDA", text: "#155724", border: "#C3E6CB" },
  rejected: { bg: "#F8D7DA", text: "#721C24", border: "#F5C6CB" },
  paid: { bg: "#CCE5FF", text: "#004085", border: "#B8DAFF" },
};

export default function PointsAndPayout() {
  const [tab, setTab] = useState("overview"); // overview | redeem | history
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    pointsToRedeem: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    upiId: "",
  });

  const token = localStorage.getItem("agentToken") || localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        axios.get(`${API}/api/points/agent/summary`, { headers }),
        axios.get(`${API}/api/points/agent/payouts`, { headers }),
      ]);
      setSummary(s.data.data);
      setPayouts(p.data.data);
    } catch (err) {
      toast.error("Failed to load points data");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!form.pointsToRedeem || Number(form.pointsToRedeem) < 100) {
      toast.error("Minimum 100 points required");
      return;
    }
    if (!form.accountNumber && !form.upiId) {
      toast.error("Provide bank account or UPI ID");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/points/agent/redeem`,
        {
          pointsToRedeem: Number(form.pointsToRedeem),
          bankDetails: {
            accountHolder: form.accountHolder,
            accountNumber: form.accountNumber,
            ifsc: form.ifsc,
            bankName: form.bankName,
            upiId: form.upiId,
          },
        },
        { headers }
      );
      toast.success("Payout request submitted!");
      setForm({ pointsToRedeem: "", accountHolder: "", accountNumber: "", ifsc: "", bankName: "", upiId: "" });
      setTab("history");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={{ color: "#6366f1", marginTop: 12, fontWeight: 600 }}>Loading your rewards...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🏆 Points & Payout</h1>
          <p style={styles.subtitle}>Track your rewards and request payouts</p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={styles.statsGrid}>
        <StatCard
          icon="⭐"
          label="Total Earned"
          value={summary?.totalEarned ?? 0}
          unit="pts"
          color="#6366f1"
          bg="#EEF2FF"
        />
        <StatCard
          icon=""
          label="Available Balance"
          value={summary?.balance ?? 0}
          unit="pts"
          color="#10b981"
          bg="#ECFDF5"
        />
        <StatCard
          icon=""
          label="Cash Equivalent"
          value={`₹${(summary?.amountEquivalent ?? 0).toFixed(2)}`}
          unit=""
          color="#f59e0b"
          bg="#FFFBEB"
        />
        <StatCard
          icon=""
          label="Total Redeemed"
          value={summary?.totalRedeemed ?? 0}
          unit="pts"
          color="#ef4444"
          bg="#FEF2F2"
        />
      </div>

      {/* ── TABS ── */}
      <div style={styles.tabBar}>
        {[
          { id: "overview", label: "Activity" },
          { id: "redeem", label: "Redeem" },
          { id: "history", label: "Payout History" },
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

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Points History</h2>
          {summary?.history?.length === 0 ? (
            <EmptyState msg="No activity yet. Start completing tasks to earn points!" />
          ) : (
            <div style={styles.historyList}>
              {summary?.history?.map((h) => (
                <div key={h._id} style={styles.historyRow}>
                  <div style={styles.historyIcon}>
                    {TASK_ICONS[h.taskKey] || TASK_ICONS.default}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.historyLabel}>{h.taskLabel || h.taskKey}</p>
                    {h.note && <p style={styles.historyNote}>{h.note}</p>}
                    <p style={styles.historyDate}>
                      {new Date(h.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div
                    style={{
                      ...styles.historyPoints,
                      color: h.points > 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {h.points > 0 ? "+" : ""}
                    {h.points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REDEEM TAB ── */}
      {tab === "redeem" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Request Payout</h2>
          <div style={styles.redeemInfo}>
            <span></span>
            <span>
              Minimum 100 points to redeem. Available:{" "}
              <strong>{summary?.balance ?? 0} pts</strong> = ₹{summary?.amountEquivalent ?? 0}
            </span>
          </div>

          <form onSubmit={handleRedeem} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Points to Redeem *</label>
              <input
                type="number"
                min="100"
                max={summary?.balance ?? 0}
                value={form.pointsToRedeem}
                onChange={(e) => setForm({ ...form, pointsToRedeem: e.target.value })}
                placeholder="Enter points (min 100)"
                style={styles.input}
                required
              />
              {form.pointsToRedeem && (
                <p style={styles.inputHint}>
                  = ₹{(Number(form.pointsToRedeem) * RATE).toFixed(2)}
                </p>
              )}
            </div>

            <div style={styles.divider}>
              <span>Bank Details (fill one of below)</span>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Account Holder</label>
                <input
                  value={form.accountHolder}
                  onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                  placeholder="Full name"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bank Name</label>
                <input
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g. SBI, HDFC"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Account Number</label>
                <input
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>IFSC Code</label>
                <input
                  value={form.ifsc}
                  onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001234"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>— OR — UPI ID</label>
              <input
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="yourname@upi"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Payout Request"}
            </button>
          </form>
        </div>
      )}

      {/* ── PAYOUT HISTORY TAB ── */}
      {tab === "history" && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Payout Requests</h2>
          {payouts.length === 0 ? (
            <EmptyState msg="No payout requests yet." />
          ) : (
            <div style={styles.payoutList}>
              {payouts.map((p) => {
                const sc = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
                return (
                  <div key={p._id} style={styles.payoutCard}>
                    <div style={styles.payoutCardTop}>
                      <div>
                        <p style={styles.payoutAmt}>₹{p.amountRequested.toFixed(2)}</p>
                        <p style={styles.payoutPts}>{p.pointsRedeemed} points redeemed</p>
                      </div>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: sc.bg,
                          color: sc.text,
                          border: `1px solid ${sc.border}`,
                          textTransform: "uppercase",
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    {p.bankDetails?.upiId && (
                      <p style={styles.payoutMeta}>UPI: {p.bankDetails.upiId}</p>
                    )}
                    {p.bankDetails?.accountNumber && (
                      <p style={styles.payoutMeta}>
                        A/C: ****{p.bankDetails.accountNumber.slice(-4)} | {p.bankDetails.bankName}
                      </p>
                    )}
                    {p.transactionId && (
                      <p style={styles.payoutMeta}>Txn ID: {p.transactionId}</p>
                    )}
                    {p.adminNote && (
                      <p style={{ ...styles.payoutMeta, color: "#dc2626" }}>
                        Admin note: {p.adminNote}
                      </p>
                    )}
                    <p style={styles.payoutDate}>
                      Requested: {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, unit, color, bg }) {
  return (
    <div style={{ ...styles.statCard, background: bg, borderColor: color + "33" }}>
      <div style={{ ...styles.statIcon, background: color + "22", color }}>{icon}</div>
      <div>
        <p style={styles.statLabel}>{label}</p>
        <p style={{ ...styles.statValue, color }}>
          {value} <span style={styles.statUnit}>{unit}</span>
        </p>
      </div>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={styles.empty}>
      <p style={{ fontSize: 36 }}>📭</p>
      <p style={{ color: "#6b7280", marginTop: 8 }}>{msg}</p>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "'Segoe UI', sans-serif",
  },
  loadingWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: 300,
  },
  spinner: {
    width: 40, height: 40, border: "4px solid #e0e7ff",
    borderTopColor: "#6366f1", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: 800, color: "#111827", margin: 0 },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: 16, marginBottom: 24,
  },
  statCard: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "16px 20px", borderRadius: 14,
    border: "1.5px solid", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
  },
  statLabel: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: 800, margin: 0 },
  statUnit: { fontSize: 12, fontWeight: 500 },
  tabBar: {
    display: "flex", gap: 8, marginBottom: 20,
    borderBottom: "2px solid #e5e7eb", paddingBottom: 0,
  },
  tab: {
    padding: "10px 20px", border: "none", background: "none",
    cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#6b7280",
    borderBottom: "3px solid transparent", marginBottom: -2,
    borderRadius: "8px 8px 0 0", transition: "all 0.15s",
  },
  tabActive: {
    color: "#6366f1", borderBottomColor: "#6366f1",
    background: "#EEF2FF",
  },
  card: {
    background: "#fff", borderRadius: 16, padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
  },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20, marginTop: 0 },
  historyList: { display: "flex", flexDirection: "column", gap: 0 },
  historyRow: {
    display: "flex", alignItems: "flex-start", gap: 14,
    padding: "14px 0", borderBottom: "1px solid #f3f4f6",
  },
  historyIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: "#f9fafb", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 20, flexShrink: 0,
  },
  historyLabel: { fontWeight: 600, color: "#374151", fontSize: 14, margin: "0 0 2px" },
  historyNote: { fontSize: 12, color: "#9ca3af", margin: "0 0 2px" },
  historyDate: { fontSize: 11, color: "#d1d5db", margin: 0 },
  historyPoints: { fontWeight: 800, fontSize: 16, flexShrink: 0 },
  redeemInfo: {
    display: "flex", gap: 10, alignItems: "flex-start",
    background: "#EEF2FF", borderRadius: 10, padding: "12px 16px",
    marginBottom: 24, fontSize: 14, color: "#4338ca",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
    fontSize: 14, outline: "none", transition: "border 0.15s",
    fontFamily: "inherit",
  },
  inputHint: { fontSize: 12, color: "#10b981", fontWeight: 600, margin: "2px 0 0" },
  divider: {
    display: "flex", alignItems: "center", gap: 12,
    color: "#9ca3af", fontSize: 13, fontWeight: 600,
  },
  submitBtn: {
    padding: "14px 28px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    marginTop: 8, transition: "opacity 0.2s",
  },
  payoutList: { display: "flex", flexDirection: "column", gap: 14 },
  payoutCard: {
    border: "1.5px solid #e5e7eb", borderRadius: 12,
    padding: "16px 20px", background: "#fafafa",
  },
  payoutCardTop: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 8,
  },
  payoutAmt: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 },
  payoutPts: { fontSize: 12, color: "#6b7280", margin: "2px 0 0" },
  payoutMeta: { fontSize: 13, color: "#374151", margin: "4px 0 0" },
  payoutDate: { fontSize: 11, color: "#9ca3af", marginTop: 8 },
  empty: { textAlign: "center", padding: "40px 20px" },
};