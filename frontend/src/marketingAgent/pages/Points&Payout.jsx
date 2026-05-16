// marketingAgent/pages/PointsAndPayout.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API  = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const RATE = 1;

const TASK_LABELS = {
  lead_submitted:          "Lead Submitted",
  order_placed:            "Order Placed",
  order_delivered:         "Order Delivered",
  response_submitted:      "Response Submitted",
  attendance_marked:       "Attendance Marked",
  training_completed:      "Training Completed",
  campaign_joined:         "Campaign Joined",
  payout_request:          "Payout Request",
  payout_refund:           "Payout Refund",
  expense_approved:        "Expense Reimbursement",
  salary_credit:           "Salary Credit",
  salary_adjustment:       "Salary Adjustment",
  points_target_achieved:  "Points Milestone Achieved", 
};

const TASK_COLORS = {
  lead_submitted:          "#6366f1",
  order_placed:            "#0891b2",
  order_delivered:         "#16a34a",
  response_submitted:      "#7c3aed",
  attendance_marked:       "#0284c7",
  training_completed:      "#d97706",
  campaign_joined:         "#db2777",
  payout_request:          "#dc2626",
  payout_refund:           "#65a30d",
  expense_approved:        "#0d9488",
  salary_credit:           "#059669",
  salary_adjustment:       "#7c3aed",
  points_target_achieved:  "#f59e0b",                     
};

const TASK_INITIALS = {
  lead_submitted:          "LS",
  order_placed:            "OP",
  order_delivered:         "OD",
  response_submitted:      "RS",
  attendance_marked:       "AM",
  training_completed:      "TC",
  campaign_joined:         "CJ",
  payout_request:          "PR",
  payout_refund:           "PF",
  expense_approved:        "₹",
  salary_credit:           "₹",
  salary_adjustment:       "SA",
  points_target_achieved:  "🏆",                          // ← new
};

const SALARY_TASK_KEYS = new Set(["expense_approved", "salary_credit", "salary_adjustment"]);

const STATUS_META = {
  pending:  { bg: "#fffbeb", text: "#92400e", border: "#fde68a", label: "Pending",  dot: "#f59e0b" },
  approved: { bg: "#f0fdf4", text: "#14532d", border: "#bbf7d0", label: "Approved", dot: "#16a34a" },
  rejected: { bg: "#fff1f2", text: "#881337", border: "#fecdd3", label: "Rejected", dot: "#f43f5e" },
  paid:     { bg: "#eff6ff", text: "#1e3a8a", border: "#bfdbfe", label: "Paid",     dot: "#3b82f6" },
};

const agentHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agentToken") || localStorage.getItem("token")}`,
});

function fmt(n) { return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` }

function Spinner({ size = 36, color = "#6366f1" }) {
  return (
    <div style={{ width: size, height: size, border: `3px solid ${color}22`, borderTopColor: color, borderRadius: "50%", animation: "pp-spin 0.7s linear infinite" }} />
  );
}

function StatCard({ label, value, unit, bg, accent, badge }) {
  return (
    <div style={{ flex: "1 1 140px", minWidth: 120, padding: "18px 20px", background: bg, borderRadius: 16, border: `1.5px solid ${accent}22`, boxShadow: `0 2px 12px ${accent}10`, position: "relative" }}>
      {badge && (
        <div style={{ position: "absolute", top: 10, right: 10, background: accent, color: "#fff", borderRadius: 20, fontSize: 9, fontWeight: 800, padding: "2px 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {badge}
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, fontWeight: 600, color: accent, opacity: 0.7 }}>{unit}</span>}
      </div>
    </div>
  );
}

function ActivityItem({ item }) {
  const key     = item.taskKey || "lead_submitted";
  const color   = TASK_COLORS[key]   || "#6366f1";
  const initial = TASK_INITIALS[key] || key.slice(0, 2).toUpperCase();
  const label   = item.taskLabel || TASK_LABELS[key] || key;
  const isPos   = item.points > 0;
  const isSalary = SALARY_TASK_KEYS.has(key);

  // ── Points milestone achievement — special card ──────────────────────────
  if (key === "points_target_achieved") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "16px",
        marginBottom: 8,
        background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
        border: "1.5px solid #fde68a",
        borderRadius: 12, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#f59e0b", borderRadius: "4px 0 0 4px" }} />
        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "#fef3c7", border: "1.5px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          🏆
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, color: "#1f2937", fontSize: 14 }}>{label}</span>
            <span style={{ background: "#f59e0b", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px" }}>
              MILESTONE
            </span>
          </div>
          {item.note && (
            <div style={{ fontSize: 12, color: "#374151", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.note}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#d97706" }}>+{item.points} pts</div>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Bonus</div>
        </div>
      </div>
    );
  }

  if (isSalary) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "16px", marginBottom: 8,
        background: isPos ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "#fff1f2",
        border: `1.5px solid ${isPos ? "#86efac" : "#fecdd3"}`,
        borderRadius: 12, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: color, borderRadius: "4px 0 0 4px" }} />
        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${color}20`, border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, color: "#1f2937", fontSize: 14 }}>{label}</span>
            <span style={{ background: color, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px", textTransform: "uppercase" }}>
              {key === "expense_approved" ? "Expense" : "Salary"}
            </span>
          </div>
          {item.note && <div style={{ fontSize: 12, color: "#374151", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.note}</div>}
          {item.expenseDate && <div style={{ fontSize: 11, color: "#6b7280" }}>For expense: {item.expenseDate}</div>}
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: isPos ? "#059669" : "#f43f5e" }}>
            {isPos ? "+" : ""}{fmt(Math.abs(item.amount || item.points || 0))}
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Salary</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `${color}15`, border: `1.5px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color }}>
        {initial}
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


const ISSUE_STATUS_META = {
  open:        { bg: "#fffbeb", text: "#92400e", border: "#fde68a", dot: "#f59e0b",  label: "Open" },
  in_progress: { bg: "#eff6ff", text: "#1e3a8a", border: "#bfdbfe", dot: "#3b82f6",  label: "In Progress" },
  resolved:    { bg: "#f0fdf4", text: "#14532d", border: "#bbf7d0", dot: "#16a34a",  label: "Resolved" },
  closed:      { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0", dot: "#94a3b8",  label: "Closed" },
};

function IssueThread({ issue, onReply, onConfirmResolved }) {
  const [reply,   setReply]   = React.useState("");
  const [sending, setSending] = React.useState(false);
  const isc = ISSUE_STATUS_META[issue.status] || ISSUE_STATUS_META.open;

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await onReply(issue._id, reply);
    setReply("");
    setSending(false);
  };

  return (
    <div style={{
      marginTop: 12, borderRadius: 12,
      border: `1.5px solid ${isc.border}`,
      background: isc.bg, overflow: "hidden",
    }}>
      {/* issue header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderBottom: `1px solid ${isc.border}`,
        flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "#1f2937" }}>
          🚩 {issue.subject}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: isc.dot }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: isc.text, textTransform: "uppercase" }}>
            {isc.label}
          </span>
        </div>
      </div>

      {/* timeline */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {(issue.timeline || []).map((entry, i) => {
          const byAdmin = entry.by === "admin";
          return (
            <div key={i} style={{
              display: "flex", gap: 8,
              justifyContent: byAdmin ? "flex-end" : "flex-start",
            }}>
              {!byAdmin && (
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "#eef2ff", color: "#6366f1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                }}>Me</div>
              )}
              <div style={{
                maxWidth: "78%", padding: "8px 12px", borderRadius: 10,
                background: byAdmin ? "#1e1b4b" : "#ffffff",
                border: byAdmin ? "none" : "1.5px solid #e2e8f0",
                color: byAdmin ? "#fff" : "#1f2937",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{entry.message}</div>
                <div style={{ fontSize: 10, color: byAdmin ? "#a5b4fc" : "#9ca3af", marginTop: 3 }}>
                  {byAdmin ? "Admin" : "You"} ·{" "}
                  {new Date(entry.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
              {byAdmin && (
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "#1e1b4b", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800,
                }}>Ad</div>
              )}
            </div>
          );
        })}
      </div>

      {/* reply box — hidden when closed */}
      {issue.status !== "closed" && (
        <div style={{ padding: "0 14px 12px", display: "flex", gap: 8 }}>
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Reply to admin…"
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              border: "1.5px solid #e5e7eb", fontSize: 13,
              outline: "none", fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            style={{
              padding: "8px 16px", background: "#6366f1", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: "pointer", opacity: (sending || !reply.trim()) ? 0.6 : 1,
            }}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      )}

      {/* confirm resolved — only shown when admin has marked resolved & agent hasn't confirmed */}
      {issue.status === "resolved" && !issue.agentConfirmedResolved && (
        <div style={{
          margin: "0 14px 14px",
          background: "#f0fdf4", border: "1.5px solid #86efac",
          borderRadius: 10, padding: "10px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
        }}>
          <div style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>
            Admin marked this as resolved. Is your issue fixed?
          </div>
          <button
            onClick={() => onConfirmResolved(issue._id)}
            style={{
              padding: "6px 14px", background: "#059669", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            ✓ Yes, resolved
          </button>
        </div>
      )}

      {issue.agentConfirmedResolved && (
        <div style={{ padding: "0 14px 12px", fontSize: 12, color: "#059669", fontWeight: 700 }}>
          ✅ You confirmed this issue is resolved
        </div>
      )}
    </div>
  );
}

function PayoutCard({ payout }) {
  const sc        = STATUS_META[payout.status] || STATUS_META.pending;
  const bd        = payout.bankDetails || {};
  const hasSalary = (payout.salaryAmount   || 0) > 0;
  const hasPoints = (payout.pointsRedeemed || 0) > 0;

  // slip
  const [slip,        setSlip]        = useState(null);
  const [showSlip,    setShowSlip]    = useState(false);
  const [loadingSlip, setLoadingSlip] = useState(false);

  // issues
  const [issues,        setIssues]        = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm,     setIssueForm]     = useState({ subject: "", description: "" });
  const [submitting,    setSubmitting]    = useState(false);

  // fetch issues for this payout (only if paid)
  const loadIssues = React.useCallback(async () => {
    if (payout.status !== "paid") return;
    setLoadingIssues(true);
    try {
      const { data } = await axios.get(
        `${API}/api/points/agent/issues?payoutId=${payout._id}`,
        { headers: agentHeaders() }
      );
      setIssues(data.data || []);
    } catch { /* silently ignore */ }
    finally { setLoadingIssues(false); }
  }, [payout._id, payout.status]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  const hasActiveIssue = issues.some(
    i => i.status === "open" || i.status === "in_progress"
  );

  const handleRaiseIssue = async () => {
    if (!issueForm.subject.trim() || !issueForm.description.trim()) {
      toast.error("Fill in subject and description"); return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/points/agent/issues`,
        { payoutId: payout._id, subject: issueForm.subject, description: issueForm.description },
        { headers: agentHeaders() }
      );
      toast.success("Issue raised! Admin will respond shortly.");
      setShowIssueForm(false);
      setIssueForm({ subject: "", description: "" });
      loadIssues();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to raise issue");
    } finally { setSubmitting(false); }
  };

  const handleReply = async (issueId, message) => {
    try {
      await axios.post(
        `${API}/api/points/agent/issues/${issueId}/reply`,
        { message },
        { headers: agentHeaders() }
      );
      loadIssues();
    } catch { toast.error("Failed to send reply"); }
  };

  const handleConfirmResolved = async (issueId) => {
    try {
      await axios.patch(
        `${API}/api/points/agent/issues/${issueId}/confirm`,
        {},
        { headers: agentHeaders() }
      );
      toast.success("Thanks for confirming!");
      loadIssues();
    } catch { toast.error("Failed"); }
  };

  const fetchSlip = async () => {
    if (slip) { setShowSlip(true); return; }
    setLoadingSlip(true);
    try {
      const { data } = await axios.get(
        `${API}/api/points/agent/slip/${payout._id}`,
        { headers: agentHeaders() }
      );
      setSlip(data.data);
      setShowSlip(true);
    } catch { toast.error("Slip not available yet"); }
    finally { setLoadingSlip(false); }
  };

  const handlePrint = () => {
    const el = document.getElementById(`slip-${payout._id}`);
    if (!el) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Payment Slip</title>
      <style>* { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', sans-serif; background: white; }
      @page { margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 400);
  };

  return (
    <>
      {/* ── MAIN CARD ── */}
      <div style={{
        padding: "18px 20px", borderRadius: 14,
        border: `1.5px solid ${sc.border}`, background: "#fff",
        marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        {/* top row */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#1f2937" }}>
              {fmt(payout.amountRequested)}
            </div>
            {payout.status === "paid" && (
              <div style={{ fontSize: 12, color: "#059669", fontWeight: 700, marginTop: 4 }}>
                ✓ Deducted from your balance
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              {hasPoints && (
                <span style={{ fontSize: 11, background: "#eef2ff", color: "#4338ca", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>
                  {payout.pointsRedeemed} pts
                </span>
              )}
              {hasSalary && (
                <span style={{ fontSize: 11, background: "#f0fdf4", color: "#15803d", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>
                  {fmt(payout.salaryAmount)} salary
                </span>
              )}
            </div>
          </div>

          {/* right column: status + action buttons */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: sc.bg, border: `1px solid ${sc.border}`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: sc.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {sc.label}
              </span>
            </div>

            {/* buttons — only on paid payouts */}
            {payout.status === "paid" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {/* view slip */}
                <button
                  onClick={fetchSlip}
                  disabled={loadingSlip}
                  style={{
                    padding: "6px 14px",
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "#fff", border: "none", borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {loadingSlip ? "Loading…" : "View Payment Slip"}
                </button>

                {/* raise issue — hidden when an active issue already exists */}
                {!hasActiveIssue && !showIssueForm && (
                  <button
                    onClick={() => setShowIssueForm(true)}
                    style={{
                      padding: "6px 14px",
                      background: "#fff1f2", color: "#dc2626",
                      border: "1.5px solid #fecdd3", borderRadius: 8,
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    🚩 Raise Issue
                  </button>
                )}

                {/* cancel raise-issue */}
                {showIssueForm && (
                  <button
                    onClick={() => { setShowIssueForm(false); setIssueForm({ subject: "", description: "" }); }}
                    style={{
                      padding: "6px 14px",
                      background: "#f3f4f6", color: "#374151",
                      border: "none", borderRadius: 8,
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* bank / txn info */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
          {bd.upiId
            ? <div style={{ fontSize: 13, color: "#374151" }}>UPI: <strong>{bd.upiId}</strong></div>
            : bd.accountNumber
            ? <div style={{ fontSize: 13, color: "#374151" }}>
                {bd.bankName} · A/C ****{bd.accountNumber.slice(-4)}
                {bd.ifsc && <span style={{ color: "#9ca3af" }}> · {bd.ifsc}</span>}
              </div>
            : null}
          {payout.transactionId && (
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginTop: 4 }}>
              Txn: {payout.transactionId}
            </div>
          )}
          {payout.adminNote && (
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>
              Note: {payout.adminNote}
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
          Requested{" "}
          {new Date(payout.createdAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          })}
          {payout.processedAt &&
            ` · Processed ${new Date(payout.processedAt).toLocaleDateString("en-IN")}`}
        </div>

        {/* ── RAISE ISSUE FORM (inline) ── */}
        {showIssueForm && (
          <div style={{
            marginTop: 14, padding: "16px 18px",
            background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", marginBottom: 12 }}>
              🚩 Raise a Payment Issue
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Subject <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={issueForm.subject}
                  onChange={e => setIssueForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Payment not received, wrong amount…"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: "1.5px solid #fca5a5", fontSize: 13,
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                    background: "#fff",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Description <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={issueForm.description}
                  onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue in detail…"
                  rows={3}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: "1.5px solid #fca5a5", fontSize: 13,
                    outline: "none", fontFamily: "inherit", resize: "vertical",
                    boxSizing: "border-box", background: "#fff",
                  }}
                />
              </div>

              <button
                onClick={handleRaiseIssue}
                disabled={submitting}
                style={{
                  padding: "10px 20px", background: "#dc2626", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1, fontFamily: "inherit",
                  alignSelf: "flex-start",
                }}
              >
                {submitting ? "Submitting…" : "Submit Issue"}
              </button>
            </div>
          </div>
        )}

        {/* ── EXISTING ISSUES ── */}
        {payout.status === "paid" && (
          <div style={{ marginTop: issues.length > 0 ? 12 : 0 }}>
            {loadingIssues && (
              <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>
                Loading issues…
              </div>
            )}
            {issues.map(issue => (
              <IssueThread
                key={issue._id}
                issue={issue}
                onReply={handleReply}
                onConfirmResolved={handleConfirmResolved}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── SLIP MODAL (unchanged from original) ── */}
      {showSlip && slip && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16,
            width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            {/* modal header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
              background: "#0f172a", borderRadius: "16px 16px 0 0",
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Payment Slip</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handlePrint}
                  style={{
                    padding: "6px 14px", background: "#6366f1", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  🖨 Print
                </button>
                <button
                  onClick={() => setShowSlip(false)}
                  style={{
                    padding: "6px 12px", background: "rgba(255,255,255,0.15)", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* slip content */}
            <div id={`slip-${payout._id}`} style={{ padding: "36px 40px", fontFamily: "'Segoe UI', sans-serif", color: "#111827" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {slip.companyLogo && <img src={slip.companyLogo} alt="logo" style={{ height: 52, objectFit: "contain" }} />}
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#1e40af", letterSpacing: "-0.02em" }}>{slip.companyName}</div>
                    {slip.companyAddress && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{slip.companyAddress}</div>}
                    {slip.companyGST     && <div style={{ fontSize: 11, color: "#6b7280" }}>GSTIN: {slip.companyGST}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#1e40af", letterSpacing: "-0.02em" }}>{slip.slipTitle}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    Date: {new Date(slip.paidOn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 2 }}>
                    Ref: {String(slip._id).slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* contact row */}
              <div style={{ display: "flex", gap: 20, marginBottom: 24, fontSize: 12, color: "#6b7280", flexWrap: "wrap" }}>
                {slip.companyPhone   && <span>📞 {slip.companyPhone}</span>}
                {slip.companyEmail   && <span>✉️ {slip.companyEmail}</span>}
                {slip.companyWebsite && <span>🌐 {slip.companyWebsite}</span>}
              </div>

              {/* paid to */}
              <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Paid To</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{slip.agentName}</div>
                {slip.agentPhone && <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>📱 {slip.agentPhone}</div>}
              </div>

              {/* amount */}
              <div style={{ background: "linear-gradient(135deg,#1e40af,#3730a3)", borderRadius: 12, padding: "20px 24px", marginBottom: 20, color: "#fff" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Amount Paid</div>
                <div style={{ fontSize: 38, fontWeight: 900 }}>{fmt(slip.amount)}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                  {slip.pointsRedeemed > 0 && <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{slip.pointsRedeemed} pts → ₹{slip.pointsRedeemed}</span>}
                  {slip.salaryAmount   > 0 && <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>Salary: {fmt(slip.salaryAmount)}</span>}
                </div>
              </div>

              {/* transaction info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Payment Mode",   value: slip.paymentMode   || "—" },
                  { label: "Transaction ID", value: slip.transactionId || "—" },
                  { label: "Payment Date",   value: new Date(slip.paidOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                  { label: "Status",         value: "✅ Paid" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{r.value}</div>
                  </div>
                ))}
              </div>

              {/* custom note */}
              {slip.slipNote && (
                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Message</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{slip.slipNote}</div>
                </div>
              )}

              {/* signature */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>This is a system-generated receipt. No physical signature required.</div>
                {slip.adminSignature && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{slip.adminSignature}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{slip.designation}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SalaryTxnItem({ txn }) {
  const isCredit = txn.type === "credit";  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: isCredit ? "#dcfce7" : "#fee2e2", border: `1.5px solid ${isCredit ? "#86efac" : "#fca5a5"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: isCredit ? "#15803d" : "#dc2626" }}>
        {isCredit ? "+" : "-"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#1f2937", fontSize: 14, marginBottom: 2 }}>
          {txn.source === "expense_approval" ? "Expense Reimbursement" : txn.source === "manual" ? "Manual Adjustment" : txn.source === "payout" ? "Payout Deducted" : txn.note || "Salary Credit"}
        </div>
        {txn.expenseDate && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Expense date: {txn.expenseDate}</div>}
        {txn.note && txn.source !== "expense_approval" && <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.note}</div>}
        <div style={{ fontSize: 11, color: "#d1d5db" }}>
          {new Date(txn.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 900, color: isCredit ? "#059669" : "#f43f5e", flexShrink: 0 }}>
        {isCredit ? "+" : ""}{fmt(Math.abs(txn.amount))}
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = "text", required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fafafa" }}
        onFocus={e => e.target.style.borderColor = "#6366f1"}
        onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
      />
    </div>
  );
}

function Empty({ title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#9ca3af" }}>{subtitle}</div>
    </div>
  );
}

function BankDetailsSection({ onBankReady }) {
  const [bankData,       setBankData]       = useState(null);
  const [loadingBank,    setLoadingBank]    = useState(true);
  const [savingBank,     setSavingBank]     = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [corrForm,       setCorrForm]       = useState({ reason: "" });
  const [corrFiles,      setCorrFiles]      = useState([]);
  const [submittingCorr, setSubmittingCorr] = useState(false);
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    accountHolder: "", accountNumber: "", ifsc: "", bankName: "", upiId: "",
  });

  useEffect(() => {
    axios.get(`${API}/api/points/agent/bank-details`, { headers: agentHeaders() })
      .then(r => {
        if (r.data.data) {
          setBankData(r.data.data);
          if (r.data.data.isLocked) onBankReady(r.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBank(false));
  }, []);

  const handleSave = async () => {
    if (!form.accountNumber && !form.upiId) {
      toast.error("Provide bank account number or UPI ID"); return;
    }
    setSavingBank(true);
    try {
      const { data } = await axios.post(
        `${API}/api/points/agent/bank-details`,
        { ...form, ifsc: form.ifsc.toUpperCase() },
        { headers: agentHeaders() }
      );
      setBankData(data.data);
      onBankReady(data.data);
      toast.success("Bank details saved and locked!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally { setSavingBank(false); }
  };

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setCorrFiles(prev => [...prev, {
          base64:  ev.target.result,
          label:   file.name,
          preview: ev.target.result,
          type:    file.type,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = idx => setCorrFiles(prev => prev.filter((_, i) => i !== idx));

  const handleCorrectionSubmit = async () => {
    if (!corrForm.reason.trim()) { toast.error("Please provide a reason"); return; }
    if (corrFiles.length === 0)  { toast.error("Please attach at least one document"); return; }
    setSubmittingCorr(true);
    try {
      await axios.post(
        `${API}/api/points/agent/bank-details/correction`,
        {
          reason:    corrForm.reason,
          documents: corrFiles.map(f => ({ base64: f.base64, label: f.label })),
        },
        { headers: agentHeaders() }
      );
      toast.success("Correction request submitted! Admin will review shortly.");
      setShowCorrection(false);
      setCorrFiles([]);
      setCorrForm({ reason: "" });
      const r = await axios.get(`${API}/api/points/agent/bank-details`, { headers: agentHeaders() });
      if (r.data.data) setBankData(r.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally { setSubmittingCorr(false); }
  };

  if (loadingBank) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
      <Spinner />
    </div>
  );

  if (bankData?.isLocked) {
    const cs = bankData.correctionStatus;
    const correctionPending = cs === "pending";

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1f2937" }}>Bank / UPI Details</span>
            <span style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 10px" }}>
              Verified & Locked
            </span>
          </div>
          {!correctionPending && (
            <button onClick={() => setShowCorrection(true)}
              style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "#eef2ff", border: "1.5px solid #c7d2fe", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
              Request Correction
            </button>
          )}
        </div>

        {/* Frosted locked fields */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Account Holder", value: bankData.accountHolder },
            { label: "Bank Name",      value: bankData.bankName },
            { label: "Account No.",    value: bankData.accountNumber ? `****${bankData.accountNumber.slice(-4)}` : "—" },
            { label: "IFSC",           value: bankData.ifsc || "—" },
            { label: "UPI ID",         value: bankData.upiId || "—" },
          ].map(f => (
            <div key={f.label} style={{
              padding: "12px 14px", borderRadius: 10, position: "relative", overflow: "hidden",
              background: "rgba(248,250,252,0.95)", border: "1.5px solid #e2e8f0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.6),rgba(241,245,249,0.4))", pointerEvents: "none" }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, position: "relative" }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: (!f.value || f.value === "—") ? "#94a3b8" : "#1f2937", position: "relative" }}>{f.value || "—"}</div>
              <div style={{ position: "absolute", top: 8, right: 8, fontSize: 11, opacity: 0.25 }}>🔒</div>
            </div>
          ))}
        </div>

        {/* Status banners */}
        {correctionPending && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}></span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Correction Request Pending</div>
              <div style={{ fontSize: 12, color: "#78350f", marginTop: 3 }}>Under admin review. You'll be notified once approved.</div>
              {bankData.correctionRequest?.reason && (
                <div style={{ fontSize: 11, color: "#92400e", marginTop: 4, fontStyle: "italic" }}>Reason: {bankData.correctionRequest.reason}</div>
              )}
            </div>
          </div>
        )}
        {cs === "approved" && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}></span>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#14532d" }}>Correction Approved — you may now update details</div>
          </div>
        )}
        {cs === "rejected" && (
          <div style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}></span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#881337" }}>Correction Request Rejected</div>
              {bankData.correctionRequest?.adminNote && (
                <div style={{ fontSize: 12, color: "#9f1239", marginTop: 3 }}>Admin note: {bankData.correctionRequest.adminNote}</div>
              )}
            </div>
          </div>
        )}

        {/* Correction form */}
        {showCorrection && !correctionPending && (
          <div style={{ marginTop: 16, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1f2937", marginBottom: 4 }}>📋 Correction Request</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Submit reason and documents. Admin will review and unlock your details.</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                Reason <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={corrForm.reason}
                onChange={e => setCorrForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Bank account changed, wrong IFSC, switching to UPI..."
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                Supporting Documents <span style={{ color: "#ef4444" }}>*</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", marginLeft: 8 }}>(Aadhaar, Passbook, Cancelled Cheque, Bank Statement)</span>
              </label>

              {corrFiles.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  {corrFiles.map((f, i) => (
                    <div key={i} style={{ position: "relative", width: 78, height: 78, borderRadius: 10, overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
                      {f.type?.startsWith("image/") ? (
                        <img src={f.preview} alt={f.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 22 }}></span>
                          <span style={{ fontSize: 9, color: "#6b7280", padding: "0 4px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{f.label}</span>
                        </div>
                      )}
                      <button onClick={() => removeFile(i)}
                        style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "#dc2626", border: "none", color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ×
                      </button>
                    </div>
                  ))}
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ width: 78, height: 78, borderRadius: 10, border: "2px dashed #c7d2fe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#eef2ff" }}>
                    <span style={{ fontSize: 22, color: "#6366f1" }}>+</span>
                    <span style={{ fontSize: 9, color: "#6366f1", fontWeight: 700 }}>Add</span>
                  </div>
                </div>
              )}

              {corrFiles.length === 0 && (
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ border: "2px dashed #c7d2fe", borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", background: "#eef2ff" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4338ca", marginBottom: 4 }}>Click to upload documents</div>
                  <div style={{ fontSize: 11, color: "#6366f1" }}>Images, PDFs accepted</div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={handleFileAdd} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCorrectionSubmit} disabled={submittingCorr}
                style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submittingCorr ? "not-allowed" : "pointer", opacity: submittingCorr ? 0.7 : 1, fontFamily: "inherit" }}>
                {submittingCorr ? "Submitting…" : "Submit Correction Request"}
              </button>
              <button onClick={() => { setShowCorrection(false); setCorrFiles([]); setCorrForm({ reason: "" }); }}
                style={{ padding: "12px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // UNLOCKED: first-time fill form 
  return (
    <div>
      <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18 }}></span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>One-Time Setup — Details lock after saving</div>
          <div style={{ fontSize: 12, color: "#78350f", marginTop: 3 }}>Enter carefully. After saving, changes require admin approval via correction request.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
        {[
          { label: "Account Holder Name", key: "accountHolder", placeholder: "Full name as per bank" },
          { label: "Bank Name",           key: "bankName",      placeholder: "e.g. SBI, HDFC, ICICI" },
          { label: "Account Number",      key: "accountNumber", placeholder: "Account number" },
          { label: "IFSC Code",           key: "ifsc",          placeholder: "e.g. SBIN0001234" },
        ].map(f => (
          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{f.label}</label>
            <input
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: f.key === "ifsc" ? e.target.value.toUpperCase() : e.target.value }))}
              placeholder={f.placeholder}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fafafa" }}
              onFocus={e  => e.target.style.borderColor = "#6366f1"}
              onBlur={e   => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, paddingTop: 8, borderTop: "1px dashed #e5e7eb", textAlign: "center", marginBottom: 14 }}>— OR use UPI —</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>UPI ID</label>
        <input
          value={form.upiId}
          onChange={e => setForm(p => ({ ...p, upiId: e.target.value }))}
          placeholder="yourname@upi"
          style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fafafa" }}
          onFocus={e => e.target.style.borderColor = "#6366f1"}
          onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
        />
      </div>

      <button onClick={handleSave} disabled={savingBank}
        style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: savingBank ? "not-allowed" : "pointer", opacity: savingBank ? 0.7 : 1, fontFamily: "inherit" }}>
        {savingBank ? "Saving…" : "Save & Lock Bank Details"}
      </button>
    </div>
  );
}

export default function PointsAndPayout() {
  const [tab,        setTab]        = useState("overview");
  const [summary,    setSummary]    = useState(null);
  const [salary,     setSalary]     = useState(null);
  const [payouts,    setPayouts]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actFilter,  setActFilter]  = useState("all");

  const [form, setForm] = useState({
    pointsToRedeem: "",
    salaryToRedeem: "",
    redeemMode:     "combined",
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, sal] = await Promise.all([
        axios.get(`${API}/api/points/agent/summary`,  { headers: agentHeaders() }),
        axios.get(`${API}/api/points/agent/payouts`,  { headers: agentHeaders() }),
        axios.get(`${API}/api/salary/agent/summary`,  { headers: agentHeaders() }).catch(() => ({ data: { data: null } })),
      ]);
      setSummary(s.data.data);
      setPayouts(p.data.data);
      setSalary(sal.data.data);
    } catch {
      toast.error("Could not load data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "ifsc" ? value.toUpperCase() : value }));
  };

  const handleRedeem = async e => {
    e.preventDefault();
    const pts    = Number(form.pointsToRedeem  || 0);
    const salAmt = Number(form.salaryToRedeem  || 0);
    const total  = pts * RATE + salAmt;

    if (total <= 0)                      { toast.error("Enter an amount to redeem"); return; }
    if (pts > (summary?.balance ?? 0))   { toast.error("Insufficient points balance"); return; }
    if (salAmt > (salary?.balance ?? 0)) { toast.error("Insufficient salary balance"); return; }

    setSubmitting(true);
    try {
      await axios.post(`${API}/api/points/agent/redeem`, {
        pointsToRedeem: pts || undefined,
        salaryToRedeem: salAmt || undefined,
        // bank details auto-fetched from backend AgentBankDetails
      }, { headers: agentHeaders() });
      toast.success("Payout request submitted!");
      setForm(f => ({ ...f, pointsToRedeem: "", salaryToRedeem: "" }));
      setTab("history");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally { setSubmitting(false); }
  };

  const balance      = summary?.balance         ?? 0;
  const earned       = summary?.totalEarned     ?? 0;
  const redeemed     = summary?.totalRedeemed   ?? 0;
  const cashValue    = balance * RATE;
  const salaryBal    = salary?.balance          ?? 0;
  const salaryEarned = salary?.totalEarned      ?? 0;
  const totalPayout  = Number(form.pointsToRedeem || 0) * RATE + Number(form.salaryToRedeem || 0);

  const allActivity = summary?.history || [];

  // separate milestone entries so we can highlight them
  const milestoneActivity = allActivity.filter(h => h.taskKey === "points_target_achieved")
  const filteredActivity  = actFilter === "all"     ? allActivity
    : actFilter === "salary"    ? allActivity.filter(h => SALARY_TASK_KEYS.has(h.taskKey))
    : actFilter === "milestone" ? milestoneActivity
    : allActivity.filter(h => !SALARY_TASK_KEYS.has(h.taskKey) && h.taskKey !== "points_target_achieved");

  return (
    <>
      <style>{`
        @keyframes pp-spin    { to { transform: rotate(360deg); } }
        @keyframes pp-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .pp-tab-btn { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 600; color: #6b7280; border-bottom: 3px solid transparent; margin-bottom: -2px; border-radius: 8px 8px 0 0; transition: all 0.15s; font-family: inherit; }
        .pp-tab-btn:hover { color: #6366f1; background: #eef2ff44; }
        .pp-tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; background: #eef2ff; }
        .pp-tab-btn.salary-tab.active { color: #059669; border-bottom-color: #059669; background: #f0fdf4; }
        .pp-tab-btn.salary-tab:hover  { color: #059669; background: #f0fdf444; }
        .pp-submit-btn { padding: 14px 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .2s, transform .15s; width: 100%; }
        .pp-submit-btn:hover:not(:disabled) { opacity: .93; transform: translateY(-1px); }
        .pp-submit-btn:disabled { opacity: .55; cursor: not-allowed; }
        .pp-mode-btn { flex: 1; padding: 10px 12px; border: 2px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 13px; font-weight: 700; color: #6b7280; border-radius: 10px; transition: all 0.15s; font-family: inherit; }
        .pp-mode-btn.active { border-color: #6366f1; background: #eef2ff; color: #6366f1; }
        .pp-act-filter { padding: 5px 14px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 12px; font-weight: 700; color: #6b7280; border-radius: 20px; font-family: inherit; }
        .pp-act-filter.active { border-color: #6366f1; background: #eef2ff; color: #6366f1; }
      `}</style>

      <div style={{ padding: "24px 20px", maxWidth: 960, margin: "0 auto", fontFamily: "'Segoe UI', system-ui, sans-serif", animation: "pp-fade-up .4s ease" }}>

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111827", margin: "0 0 4px" }}>Points & Payout</h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Track earned points, salary balance, and withdraw your rewards</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ padding: "6px 16px", background: "#fffbeb", color: "#b45309", border: "1.5px solid #fde68a", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              1 pt = ₹{RATE}
            </div>
            <div style={{ padding: "6px 16px", background: "#f0fdf4", color: "#15803d", border: "1.5px solid #86efac", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              Salary: {fmt(salaryBal)}
            </div>
            {milestoneActivity.length > 0 && (
              <div style={{ padding: "6px 16px", background: "#fffbeb", color: "#b45309", border: "1.5px solid #fde68a", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                🏆 {milestoneActivity.length} milestone{milestoneActivity.length > 1 ? "s" : ""} achieved
              </div>
            )}
          </div>
        </div>

        {/* stat cards */}
        {loading ? (
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ flex: "1 1 140px", minWidth: 120, height: 80, background: "#f3f4f6", borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Points</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <StatCard label="Total Earned"      value={earned}   unit="pts" bg="#eef2ff" accent="#6366f1" />
                <StatCard label="Available Balance" value={balance}  unit="pts" bg="#f0fdf4" accent="#16a34a" />
                <StatCard label="Cash Value"        value={`₹${cashValue.toFixed(2)}`} unit="" bg="#fffbeb" accent="#d97706" />
                <StatCard label="Total Redeemed"    value={redeemed} unit="pts" bg="#fff1f2" accent="#f43f5e" />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Salary (from Approved Expenses)</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <StatCard label="Salary Balance"  value={fmt(salaryBal)}               unit="" bg="#f0fdf4"  accent="#059669" badge="Cash" />
                <StatCard label="Total Earned"    value={fmt(salaryEarned)}             unit="" bg="#ecfdf5"  accent="#10b981" />
                <StatCard label="Total Paid Out"  value={fmt((salary?.totalPaid) ?? 0)} unit="" bg="#fff1f2" accent="#f43f5e" />
              </div>
            </div>
          </>
        )}

        {/* combined banner */}
        {!loading && (balance > 0 || salaryBal > 0) && (
          <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Total Available for Payout</div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{fmt(balance * RATE + salaryBal)}</div>
              <div style={{ fontSize: 13, color: "#c7d2fe", marginTop: 4 }}>
                {balance > 0 && `${balance} pts (₹${(balance * RATE).toFixed(0)})`}
                {balance > 0 && salaryBal > 0 && " + "}
                {salaryBal > 0 && `${fmt(salaryBal)} salary`}
              </div>
            </div>
            <button onClick={() => setTab("redeem")}
              style={{ padding: "12px 24px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Request Payout →
            </button>
          </div>
        )}

        {/* tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e5e7eb", overflowX: "auto" }}>
          {[
            { id: "overview", label: "Activity",       className: "" },
            { id: "salary",   label: "Salary",         className: "salary-tab" },
            { id: "redeem",   label: "Redeem",         className: "" },
            { id: "history",  label: "Payout History", className: "" },
          ].map(t => (
            <button key={t.id} className={`pp-tab-btn ${t.className} ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === "history" && payouts.length > 0 && (
                <span style={{ marginLeft: 6, background: "#6366f1", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{payouts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── ACTIVITY TAB ── */}
        {tab === "overview" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>Points Activity</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  ["all",       "All"],
                  ["points",    "Points"],
                  ["salary",    "Salary/Expenses"],
                  ["milestone", `🏆 Milestones${milestoneActivity.length > 0 ? ` (${milestoneActivity.length})` : ""}`],
                ].map(([v, l]) => (
                  <button key={v} className={`pp-act-filter ${actFilter === v ? "active" : ""}`} onClick={() => setActFilter(v)}>{l}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
            ) : !filteredActivity.length ? (
              <Empty title="No activity yet" subtitle="Complete tasks, hit milestones, and get expenses approved to see activity!" />
            ) : (
              <div>
                {/* milestone section at top when showing all */}
                {actFilter === "all" && milestoneActivity.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🏆 Points Milestones</div>
                    {milestoneActivity.map(h => <ActivityItem key={h._id} item={h} />)}
                    <div style={{ height: 1, background: "#e5e7eb", margin: "16px 0" }} />
                  </div>
                )}
                {/* salary section when showing all */}
                {actFilter === "all" && filteredActivity.filter(h => SALARY_TASK_KEYS.has(h.taskKey)).length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Expense & Salary Credits</div>
                    {filteredActivity.filter(h => SALARY_TASK_KEYS.has(h.taskKey)).map(h => <ActivityItem key={h._id} item={h} />)}
                    <div style={{ height: 1, background: "#e5e7eb", margin: "16px 0" }} />
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Points Activity</div>
                  </div>
                )}
                {/* main list */}
                {filteredActivity
                  .filter(h =>
                    actFilter === "all"
                      ? !SALARY_TASK_KEYS.has(h.taskKey) && h.taskKey !== "points_target_achieved"
                      : true
                  )
                  .map(h => <ActivityItem key={h._id} item={h} />)
                }
              </div>
            )}
          </div>
        )}

        {/* ── SALARY TAB ── */}
        {tab === "salary" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", borderRadius: 16, padding: "24px", marginBottom: 20, color: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Current Salary Balance</div>
              <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4 }}>{fmt(salaryBal)}</div>
              <div style={{ fontSize: 13, color: "#a7f3d0" }}>Earned from {salary?.transactionCount || 0} approved expense{salary?.transactionCount !== 1 ? "s" : ""} · Total earned: {fmt(salaryEarned)}</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 20 }}>ℹ️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#14532d", marginBottom: 4 }}>How Salary Balance Works</div>
                <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
                  When admin approves your expense report, the full amount is credited here as your salary reimbursement. You can request payout of this balance at any time — no minimum limit.
                </div>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>Salary Transactions</h3>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner color="#059669" /></div>
              ) : !salary?.transactions?.length ? (
                <Empty title="No salary credits yet" subtitle="Get expense reports approved to start earning salary credits." />
              ) : (
                salary.transactions.map(txn => <SalaryTxnItem key={txn._id} txn={txn} />)
              )}
            </div>
          </div>
        )}
        

        {/* ── REDEEM TAB ── */}
        {/* ── REDEEM TAB ── */}
        {tab === "redeem" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Request Payout</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>Payouts are processed at month end · No minimum limit · Combine points &amp; salary</p>

            {/* Balance cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px", minWidth: 140, background: "#eef2ff", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #c7d2fe" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4338ca", marginBottom: 4 }}>Points Balance</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#4338ca" }}>{balance} pts</div>
                <div style={{ fontSize: 12, color: "#6366f1" }}>= {fmt(balance * RATE)}</div>
              </div>
              <div style={{ flex: "1 1 160px", minWidth: 140, background: "#f0fdf4", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #86efac" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>Salary Balance</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#15803d" }}>{fmt(salaryBal)}</div>
                <div style={{ fontSize: 12, color: "#16a34a" }}>Expense reimbursements</div>
              </div>
              <div style={{ flex: "1 1 160px", minWidth: 140, background: "#1e1b4b", borderRadius: 12, padding: "14px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 4 }}>Total Available</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{fmt(balance * RATE + salaryBal)}</div>
                <div style={{ fontSize: 12, color: "#c7d2fe" }}>Request all or partial</div>
              </div>
            </div>

            {/* Redeem mode */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>What would you like to redeem?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { id: "combined", label: "Both (Points + Salary)" },
                  { id: "points",   label: "Points Only" },
                  { id: "salary",   label: "Salary Only" },
                ].map(m => (
                  <button key={m.id} className={`pp-mode-btn ${form.redeemMode === m.id ? "active" : ""}`}
                    onClick={() => setForm(f => ({ ...f, redeemMode: m.id, pointsToRedeem: "", salaryToRedeem: "" }))}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              {(form.redeemMode === "points" || form.redeemMode === "combined") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Points to Redeem</label>
                  <input type="number" name="pointsToRedeem" value={form.pointsToRedeem}
                    onChange={handleChange} placeholder={`Enter points (max ${balance})`}
                    min="1" max={balance}
                    style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fafafa" }}
                  />
                  {form.pointsToRedeem && Number(form.pointsToRedeem) > 0 && (
                    <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 800 }}>= {fmt(Number(form.pointsToRedeem) * RATE)}</div>
                  )}
                  <button type="button" style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => setForm(f => ({ ...f, pointsToRedeem: String(balance) }))}>
                    Redeem all {balance} pts
                  </button>
                </div>
              )}

              {(form.redeemMode === "salary" || form.redeemMode === "combined") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Salary Amount to Redeem (₹)</label>
                  <input type="number" name="salaryToRedeem" value={form.salaryToRedeem}
                    onChange={handleChange} placeholder={`Enter amount (max ${salaryBal.toFixed(2)})`}
                    min="0.01" max={salaryBal} step="0.01"
                    style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fafafa" }}
                  />
                  <button type="button" style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: "#059669", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => setForm(f => ({ ...f, salaryToRedeem: String(salaryBal.toFixed(2)) }))}>
                    Redeem full salary {fmt(salaryBal)}
                  </button>
                </div>
              )}

              {totalPayout > 0 && (
                <div style={{ background: "#1e1b4b", borderRadius: 12, padding: "16px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Payout Request</div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{fmt(totalPayout)}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#c7d2fe" }}>
                    {Number(form.pointsToRedeem || 0) > 0 && <div>{form.pointsToRedeem} pts → {fmt(Number(form.pointsToRedeem) * RATE)}</div>}
                    {Number(form.salaryToRedeem || 0) > 0 && <div>Salary → {fmt(Number(form.salaryToRedeem))}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* ── BANK DETAILS SECTION ── */}
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20, marginBottom: 20 }}>
              <BankDetailsSection onBankReady={() => {}} />
            </div>

            <div style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
              No minimum payout limit · Payouts processed at <strong>month end</strong> · Bank details auto-used from locked profile
            </div>

            <button onClick={handleRedeem} className="pp-submit-btn" disabled={submitting || (balance <= 0 && salaryBal <= 0)}>
              {submitting ? "Submitting…" : `Submit Payout Request${totalPayout > 0 ? ` — ${fmt(totalPayout)}` : ""} →`}
            </button>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Payout Requests</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>All payout requests including points, salary, and combined payouts</p>
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