// marketingAgent/pages/Points&Payout.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const RATE = 1; 

const TASK_ICONS = {
  lead_submitted:      "",
  order_placed:        "",
  order_delivered:     "",
  response_submitted:  "",
  attendance_marked:   "",
  training_completed:  "",
  campaign_joined:     "",
  payout_request:      "",
  payout_refund:       "",
};

const STATUS_META = {
  pending:  { bg: "#FFF3CD", text: "#856404", border: "#FFEAA7", label: "Pending" },
  approved: { bg: "#D4EDDA", text: "#155724", border: "#C3E6CB", label: "Approved" },
  rejected: { bg: "#F8D7DA", text: "#721C24", border: "#F5C6CB", label: "Rejected" },
  paid:     { bg: "#CCE5FF", text: "#004085", border: "#B8DAFF", label: "Paid" },
};

const agentHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agentToken") || localStorage.getItem("token")}`,
});

export default function PointsAndPayout() {
  const [tab, setTab]         = useState("overview");
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    pointsToRedeem: "",
    accountHolder: "", accountNumber: "", ifsc: "", bankName: "", upiId: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        axios.get(`${API}/api/points/agent/summary`,  { headers: agentHeaders() }),
        axios.get(`${API}/api/points/agent/payouts`,  { headers: agentHeaders() }),
      ]);
      setSummary(s.data.data);
      setPayouts(p.data.data);
    } catch {
      toast.error("Could not load points data");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    const pts = Number(form.pointsToRedeem);
    if (!pts || pts < 100) { toast.error("Minimum 100 points required"); return; }
    if (pts > (summary?.balance ?? 0)) { toast.error("Insufficient balance"); return; }
    if (!form.accountNumber && !form.upiId) { toast.error("Provide bank account or UPI ID"); return; }

    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/points/agent/redeem`,
        {
          pointsToRedeem: pts,
          bankDetails: {
            accountHolder: form.accountHolder,
            accountNumber: form.accountNumber,
            ifsc: form.ifsc,
            bankName: form.bankName,
            upiId: form.upiId,
          },
        },
        { headers: agentHeaders() }
      );
      toast.success("Payout request submitted successfully!");
      setForm({ pointsToRedeem: "", accountHolder: "", accountNumber: "", ifsc: "", bankName: "", upiId: "" });
      setTab("history");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <div style={S.spinner} />
        <p style={{ color: "#6366f1", marginTop: 12, fontWeight: 600 }}>Loading your rewards...</p>
      </div>
    );
  }

  const balance  = summary?.balance ?? 0;
  const earned   = summary?.totalEarned ?? 0;
  const redeemed = summary?.totalRedeemed ?? 0;
  const cash     = summary?.amountEquivalent ?? 0;

  return (
    <div style={S.page}>
      {/* ── HEADER ── */}
      <div style={S.headerRow}>
        <div>
          <h2 style={S.title}>Points & Payout</h2>
          <p style={S.subtitle}>Track your earned points and withdraw your rewards</p>
        </div>
        <div style={S.conversionBadge}>1 pt = ₹{RATE}</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={S.statsGrid}>
        <StatCard icon="" label="Total Earned"     value={earned}            unit="pts"  bg="#EEF2FF" />
        <StatCard icon="" label="Available Balance" value={balance}           unit="pts" bg="#ECFDF5" />
        <StatCard icon="" label="Cash Equivalent"  value={`₹${cash.toFixed(2)}`} unit="" bg="#FFFBEB" />
        <StatCard icon="" label="Total Redeemed"   value={redeemed}          unit="pts"  bg="#FEF2F2" />
      </div>

      {/* ── TABS ── */}
      <div style={S.tabBar}>
        {[
          { id: "overview", label: "Activity" },
          { id: "redeem",   label: "Redeem" },
          { id: "history",  label: "Payout History" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div style={S.card}>
          <h3 style={S.sectionTitle}>Points Activity History</h3>
          {!summary?.history?.length ? (
            <Empty msg="No activity yet. Complete tasks to earn points!" />
          ) : (
            <div>
              {summary.history.map((h) => (
                <div key={h._id} style={S.historyRow}>
                  <div style={S.historyIcon}>{TASK_ICONS[h.taskKey] || ""}</div>
                  <div style={{ flex: 1 }}>
                    <p style={S.historyLabel}>{h.taskLabel || h.taskKey}</p>
                    {h.note && <p style={S.historyNote}>{h.note}</p>}
                    <p style={S.historyDate}>
                      {new Date(h.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p style={{ ...S.historyPts, color: h.points > 0 ? "#10b981" : "#ef4444" }}>
                    {h.points > 0 ? "+" : ""}{h.points} pts
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REDEEM ── */}
      {tab === "redeem" && (
        <div style={S.card}>
          <h3 style={S.sectionTitle}>Request Payout</h3>

          <div style={S.infoBox}>
            <span style={{ fontSize: 18 }}></span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#4338ca" }}>
                Available: {balance} pts = ₹{cash.toFixed(2)}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6366f1" }}>
                Minimum 100 points required to redeem. Processed within 3-5 business days.
              </p>
            </div>
          </div>

          {balance < 100 && (
            <div style={S.warningBox}>
              ⚠️ You need at least 100 points to raise a payout request. Keep completing tasks to earn more!
            </div>
          )}

          <form onSubmit={handleRedeem} style={S.form}>
            <div style={S.formGroup}>
              <label style={S.label}>Points to Redeem *</label>
              <input
                type="number" min="100" max={balance}
                value={form.pointsToRedeem}
                onChange={(e) => setForm({ ...form, pointsToRedeem: e.target.value })}
                placeholder={`Enter points (min 100, max ${balance})`}
                style={S.input}
                required
              />
              {form.pointsToRedeem && (
                <p style={{ fontSize: 13, color: "#10b981", fontWeight: 700, margin: "4px 0 0" }}>
                  = ₹{(Number(form.pointsToRedeem) * RATE).toFixed(2)}
                </p>
              )}
            </div>

            <div style={S.dividerLabel}>Bank Details (fill bank OR UPI)</div>

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Account Holder Name</label>
                <input value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="Full name as per bank" style={S.input} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Bank Name</label>
                <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. SBI, HDFC, Axis" style={S.input} />
              </div>
            </div>

            <div style={S.formRow}>
              <div style={S.formGroup}>
                <label style={S.label}>Account Number</label>
                <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Enter account number" style={S.input} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>IFSC Code</label>
                <input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} placeholder="e.g. SBIN0001234" style={S.input} />
              </div>
            </div>

            <div style={S.dividerLabel}>— OR —</div>

            <div style={S.formGroup}>
              <label style={S.label}>UPI ID</label>
              <input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="yourname@upi" style={S.input} />
            </div>

            <button
              type="submit"
              disabled={submitting || balance < 100}
              style={{ ...S.submitBtn, opacity: (submitting || balance < 100) ? 0.6 : 1, cursor: (submitting || balance < 100) ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Submitting..." : "Submit Payout Request"}
            </button>
          </form>
        </div>
      )}

      {/* ── PAYOUT HISTORY ── */}
      {tab === "history" && (
        <div style={S.card}>
          <h3 style={S.sectionTitle}>Payout Requests</h3>
          {!payouts.length ? (
            <Empty msg="No payout requests yet." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {payouts.map((p) => {
                const sc = STATUS_META[p.status] || STATUS_META.pending;
                const bd = p.bankDetails || {};
                return (
                  <div key={p._id} style={S.payoutCard}>
                    <div style={S.payoutTop}>
                      <div>
                        <p style={S.payoutAmt}>₹{p.amountRequested.toFixed(2)}</p>
                        <p style={S.payoutPts}>{p.pointsRedeemed} points redeemed</p>
                      </div>
                      <span style={{
                        padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        textTransform: "uppercase",
                      }}>
                        {sc.label}
                      </span>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      {bd.upiId ? (
                        <p style={S.payoutMeta}>UPI: {bd.upiId}</p>
                      ) : bd.accountNumber ? (
                        <p style={S.payoutMeta}>
                          {bd.bankName} — A/C ****{bd.accountNumber.slice(-4)} | {bd.ifsc}
                        </p>
                      ) : null}

                      {p.transactionId && (
                        <p style={{ ...S.payoutMeta, color: "#10b981", fontWeight: 700 }}>
                          Txn ID: {p.transactionId}
                        </p>
                      )}
                      {p.adminNote && (
                        <p style={{ ...S.payoutMeta, color: "#dc2626" }}>
                          Note: {p.adminNote}
                        </p>
                      )}
                    </div>

                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                      Requested on {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                      {p.processedAt && ` · Processed ${new Date(p.processedAt).toLocaleDateString("en-IN")}`}
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
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, background: bg, border: `1.5px solid ${color}22`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>
          {value} <span style={{ fontSize: 12, fontWeight: 500 }}>{unit}</span>
        </p>
      </div>
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <p style={{ fontSize: 36 }}></p>
      <p style={{ color: "#6b7280", marginTop: 8 }}>{msg}</p>
    </div>
  );
}

const S = {
  page: { padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "'Segoe UI', sans-serif" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 },
  spinner: { width: 40, height: 40, border: "4px solid #e0e7ff", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: "#111827", margin: 0 },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  conversionBadge: { padding: "6px 16px", background: "#FFFBEB", color: "#d97706", border: "1.5px solid #FDE68A", borderRadius: 20, fontSize: 13, fontWeight: 700 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16, marginBottom: 24 },
  tabBar: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e5e7eb" },
  tab: { padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#6b7280", borderBottom: "3px solid transparent", marginBottom: -2, borderRadius: "8px 8px 0 0", transition: "all 0.15s", fontFamily: "inherit" },
  tabActive: { color: "#6366f1", borderBottomColor: "#6366f1", background: "#EEF2FF" },
  card: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20, marginTop: 0 },
  historyRow: { display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid #f3f4f6" },
  historyIcon: { width: 40, height: 40, borderRadius: 10, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  historyLabel: { fontWeight: 600, color: "#374151", fontSize: 14, margin: "0 0 2px" },
  historyNote: { fontSize: 12, color: "#9ca3af", margin: "0 0 2px" },
  historyDate: { fontSize: 11, color: "#d1d5db", margin: 0 },
  historyPts: { fontWeight: 800, fontSize: 16, flexShrink: 0, margin: 0 },
  infoBox: { display: "flex", gap: 12, background: "#EEF2FF", borderRadius: 10, padding: "14px 16px", marginBottom: 20 },
  warningBox: { background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400e", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, fontWeight: 500 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit" },
  dividerLabel: { fontSize: 13, fontWeight: 700, color: "#9ca3af", textAlign: "center", borderTop: "1px solid #f3f4f6", paddingTop: 12 },
  submitBtn: { padding: "14px 28px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8, fontFamily: "inherit" },
  payoutCard: { border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", background: "#fafafa" },
  payoutTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  payoutAmt: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 },
  payoutPts: { fontSize: 12, color: "#6b7280", margin: "2px 0 0" },
  payoutMeta: { fontSize: 13, color: "#374151", margin: "4px 0 0" },
};