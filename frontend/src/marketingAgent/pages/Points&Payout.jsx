// marketingAgent/pages/PointsAndPayout.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API  = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const RATE = 1;

const TASK_LABELS = {
  lead_submitted:     "Lead Submitted",
  order_placed:       "Order Placed",
  order_delivered:    "Order Delivered",
  response_submitted: "Response Submitted",
  attendance_marked:  "Attendance Marked",
  training_completed: "Training Completed",
  campaign_joined:    "Campaign Joined",
  payout_request:     "Payout Request",
  payout_refund:      "Payout Refund",
};

const TASK_COLORS = {
  lead_submitted:     "#6366f1",
  order_placed:       "#0891b2",
  order_delivered:    "#16a34a",
  response_submitted: "#7c3aed",
  attendance_marked:  "#0284c7",
  training_completed: "#d97706",
  campaign_joined:    "#db2777",
  payout_request:     "#dc2626",
  payout_refund:      "#65a30d",
};

const TASK_INITIALS = {
  lead_submitted:     "LS",
  order_placed:       "OP",
  order_delivered:    "OD",
  response_submitted: "RS",
  attendance_marked:  "AM",
  training_completed: "TC",
  campaign_joined:    "CJ",
  payout_request:     "PR",
  payout_refund:      "PF",
};

const STATUS_META = {
  pending:  { bg: "#fffbeb", text: "#92400e", border: "#fde68a", label: "Pending",  dot: "#f59e0b" },
  approved: { bg: "#f0fdf4", text: "#14532d", border: "#bbf7d0", label: "Approved", dot: "#16a34a" },
  rejected: { bg: "#fff1f2", text: "#881337", border: "#fecdd3", label: "Rejected", dot: "#f43f5e" },
  paid:     { bg: "#eff6ff", text: "#1e3a8a", border: "#bfdbfe", label: "Paid",     dot: "#3b82f6" },
};

const agentHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agentToken") || localStorage.getItem("token")}`,
});

//  Spinner 
function Spinner({ size = 36, color = "#6366f1" }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${color}22`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "pp-spin 0.7s linear infinite",
    }} />
  );
}

// Stat Card 
function StatCard({ label, value, unit, bg, accent }) {
  return (
    <div style={{
      flex: "1 1 140px", minWidth: 120,
      padding: "18px 20px",
      background: bg,
      borderRadius: 16,
      border: `1.5px solid ${accent}22`,
      boxShadow: `0 2px 12px ${accent}10`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, fontWeight: 600, color: accent, opacity: 0.7 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ item }) {
  const key     = item.taskKey || "lead_submitted";
  const color   = TASK_COLORS[key]   || "#6366f1";
  const initials = TASK_INITIALS[key] || key.slice(0, 2).toUpperCase();
  const label   = item.taskLabel || TASK_LABELS[key] || key;
  const isPos   = item.points > 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0",
      borderBottom: "1px solid #f3f4f6",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `${color}15`,
        border: `1.5px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#1f2937", fontSize: 14, marginBottom: 2 }}>{label}</div>
        {item.note && <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.note}</div>}
        <div style={{ fontSize: 11, color: "#d1d5db" }}>
          {new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 900, color: isPos ? "#10b981" : "#f43f5e", flexShrink: 0 }}>
        {isPos ? "+" : ""}{item.points} pts
      </div>
    </div>
  );
}

// ── Payout Card ───────────────────────────────────────────────────────────────
function PayoutCard({ payout }) {
  const sc = STATUS_META[payout.status] || STATUS_META.pending;
  const bd = payout.bankDetails || {};
  return (
    <div style={{
      padding: "18px 20px",
      borderRadius: 14,
      border: `1.5px solid ${sc.border}`,
      background: "#fff",
      marginBottom: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1f2937" }}>₹{payout.amountRequested.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{payout.pointsRedeemed} points redeemed</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: sc.bg, border: `1px solid ${sc.border}` }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: sc.text, textTransform: "uppercase", letterSpacing: 0.5 }}>{sc.label}</span>
        </div>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
        {bd.upiId ? (
          <div style={{ fontSize: 13, color: "#374151" }}>UPI: <strong>{bd.upiId}</strong></div>
        ) : bd.accountNumber ? (
          <div style={{ fontSize: 13, color: "#374151" }}>
            {bd.bankName} · A/C ****{bd.accountNumber.slice(-4)}
            {bd.ifsc && <span style={{ color: "#9ca3af" }}> · {bd.ifsc}</span>}
          </div>
        ) : null}
        {payout.transactionId && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginTop: 4 }}>Txn: {payout.transactionId}</div>}
        {payout.adminNote     && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>Note: {payout.adminNote}</div>}
      </div>

      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
        Requested {new Date(payout.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        {payout.processedAt && ` · Processed ${new Date(payout.processedAt).toLocaleDateString("en-IN")}`}
      </div>
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, placeholder, type = "text", required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{
          padding: "10px 14px", borderRadius: 10,
          border: "1.5px solid #e5e7eb", fontSize: 14,
          outline: "none", fontFamily: "inherit", background: "#fafafa",
          transition: "border-color .2s",
        }}
        onFocus={e => e.target.style.borderColor = "#6366f1"}
        onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
      />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function Empty({ title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#9ca3af" }}>{subtitle}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PointsAndPayout() {
  const [tab,        setTab]        = useState("overview");
  const [summary,    setSummary]    = useState(null);
  const [payouts,    setPayouts]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    pointsToRedeem: "", accountHolder: "", accountNumber: "",
    ifsc: "", bankName: "", upiId: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        axios.get(`${API}/api/points/agent/summary`, { headers: agentHeaders() }),
        axios.get(`${API}/api/points/agent/payouts`, { headers: agentHeaders() }),
      ]);
      setSummary(s.data.data);
      setPayouts(p.data.data);
    } catch {
      toast.error("Could not load points data");
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "ifsc" ? value.toUpperCase() : value }));
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    const pts = Number(form.pointsToRedeem);
    if (!pts || pts < 100)               { toast.error("Minimum 100 points required"); return; }
    if (pts > (summary?.balance ?? 0))   { toast.error("Insufficient balance"); return; }
    if (!form.accountNumber && !form.upiId) { toast.error("Provide bank account or UPI ID"); return; }

    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/points/agent/redeem`,
        { pointsToRedeem: pts, bankDetails: { accountHolder: form.accountHolder, accountNumber: form.accountNumber, ifsc: form.ifsc, bankName: form.bankName, upiId: form.upiId } },
        { headers: agentHeaders() }
      );
      toast.success("Payout request submitted!");
      setForm({ pointsToRedeem: "", accountHolder: "", accountNumber: "", ifsc: "", bankName: "", upiId: "" });
      setTab("history");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally { setSubmitting(false); }
  };

  const balance  = summary?.balance      ?? 0;
  const earned   = summary?.totalEarned  ?? 0;
  const redeemed = summary?.totalRedeemed ?? 0;
  const cash     = summary?.amountEquivalent ?? 0;

  return (
    <>
      <style>{`
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        @keyframes pp-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .pp-tab-btn { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #6b7280; border-bottom: 3px solid transparent; margin-bottom: -2px; border-radius: 8px 8px 0 0; transition: all 0.15s; font-family: inherit; }
        .pp-tab-btn:hover { color: #6366f1; background: #eef2ff44; }
        .pp-tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; background: #eef2ff; }
        .pp-submit-btn { padding: 14px 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .2s, transform .15s; }
        .pp-submit-btn:hover:not(:disabled) { opacity: .93; transform: translateY(-1px); }
        .pp-submit-btn:disabled { opacity: .55; cursor: not-allowed; }
        .pp-input:focus { border-color: #6366f1 !important; background: #fff !important; }
      `}</style>

      <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto", fontFamily: "'Segoe UI', system-ui, sans-serif", animation: "pp-fade-up .4s ease" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111827", margin: "0 0 4px" }}>Points & Payout</h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Track your earned points and withdraw your rewards</p>
          </div>
          <div style={{ padding: "6px 16px", background: "#fffbeb", color: "#b45309", border: "1.5px solid #fde68a", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
            1 pt = ₹{RATE}
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ flex: "1 1 140px", minWidth: 120, height: 80, background: "#f3f4f6", borderRadius: 16, animation: "pp-fade-up .3s ease" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
            <StatCard label="Total Earned"      value={earned}                    unit="pts"  bg="#eef2ff"  accent="#6366f1" />
            <StatCard label="Available Balance" value={balance}                   unit="pts"  bg="#f0fdf4"  accent="#16a34a" />
            <StatCard label="Cash Value"        value={`₹${cash.toFixed(2)}`}     unit=""     bg="#fffbeb"  accent="#d97706" />
            <StatCard label="Total Redeemed"    value={redeemed}                  unit="pts"  bg="#fff1f2"  accent="#f43f5e" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
          {[{ id: "overview", label: "Activity" }, { id: "redeem", label: "Redeem" }, { id: "history", label: "Payout History" }].map(t => (
            <button key={t.id} className={`pp-tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === "history" && payouts.length > 0 && (
                <span style={{ marginLeft: 6, background: "#6366f1", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{payouts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── ACTIVITY ── */}
        {tab === "overview" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>Points Activity</h3>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
            ) : !summary?.history?.length ? (
              <Empty title="No activity yet" subtitle="Complete tasks to start earning points!" />
            ) : (
              summary.history.map(h => <ActivityItem key={h._id} item={h} />)
            )}
          </div>
        )}

        {/* ── REDEEM ── */}
        {tab === "redeem" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Request Payout</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>Processed within 3–5 business days</p>

            {/* Balance Info */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#eef2ff", borderRadius: 12, padding: "14px 18px", marginBottom: 20, flexWrap: "wrap", gap: 8,
            }}>
              <div>
                <div style={{ fontSize: 13, color: "#4338ca", fontWeight: 700 }}>Available: {balance} pts = ₹{cash.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2 }}>Minimum 100 points required</div>
              </div>
              {balance < 100 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600 }}>
                  ⚠ Need {100 - balance} more pts
                </div>
              )}
            </div>

            <form onSubmit={handleRedeem} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Points field */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Points to Redeem <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  className="pp-input"
                  type="number" name="pointsToRedeem" value={form.pointsToRedeem}
                  onChange={handleChange} placeholder={`Enter points (min 100, max ${balance})`}
                  min="100" max={balance} required
                  style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fafafa" }}
                />
                {form.pointsToRedeem && Number(form.pointsToRedeem) >= 100 && (
                  <div style={{ fontSize: 13, color: "#10b981", fontWeight: 800 }}>
                    = ₹{(Number(form.pointsToRedeem) * RATE).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, paddingTop: 8, borderTop: "1px solid #f3f4f6" }}>
                Bank Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                <Field label="Account Holder Name" name="accountHolder" value={form.accountHolder} onChange={handleChange} placeholder="Full name as per bank" />
                <Field label="Bank Name"            name="bankName"      value={form.bankName}      onChange={handleChange} placeholder="e.g. SBI, HDFC" />
                <Field label="Account Number"       name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Account number" />
                <Field label="IFSC Code"            name="ifsc"          value={form.ifsc}          onChange={handleChange} placeholder="e.g. SBIN0001234" />
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, paddingTop: 8, borderTop: "1px dashed #e5e7eb", textAlign: "center" }}>
                — OR use UPI —
              </div>
              <Field label="UPI ID" name="upiId" value={form.upiId} onChange={handleChange} placeholder="yourname@upi" />

              <button type="submit" className="pp-submit-btn" disabled={submitting || balance < 100}>
                {submitting ? "Submitting…" : "Submit Payout Request →"}
              </button>
            </form>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>Payout Requests</h3>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
            ) : !payouts.length ? (
              <Empty title="No payout requests yet" subtitle="Submit a redemption request to see history here." />
            ) : (
              payouts.map(p => <PayoutCard key={p._id} payout={p} />)
            )}
          </div>
        )}
      </div>
    </>
  );
}