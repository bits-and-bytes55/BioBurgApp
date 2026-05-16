import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STATUS_META = {
  pending:  { bg: "#FFF3CD", text: "#856404", border: "#FFEAA7" },
  approved: { bg: "#D4EDDA", text: "#155724", border: "#C3E6CB" },
  rejected: { bg: "#F8D7DA", text: "#721C24", border: "#F5C6CB" },
  paid:     { bg: "#CCE5FF", text: "#004085", border: "#B8DAFF" },
};

const ISSUE_STATUS_META = {
  open:        { bg: "#FFF3CD", text: "#856404", border: "#FFEAA7", label: "Open" },
  in_progress: { bg: "#CCE5FF", text: "#004085", border: "#B8DAFF", label: "In Progress" },
  resolved:    { bg: "#D4EDDA", text: "#155724", border: "#C3E6CB", label: "Resolved" },
  closed:      { bg: "#e9ecef", text: "#495057", border: "#dee2e6", label: "Closed" },
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

const adminHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });
const fmt = n => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const getAgentName = (p) => {
  if (p.agentName && p.agentName !== "undefined" && p.agentName.trim()) return p.agentName;
  if (p.agentId?.name) return p.agentId.name;
  return "—";
};

const getAgentPhone = (p) => {
  if (p.agentPhone && p.agentPhone !== "undefined" && p.agentPhone.trim()) return p.agentPhone;
  if (p.agentId?.phone) return p.agentId.phone;
  return "—";
};

const EMPTY_SLIP = {
  companyName:    "BioBurg Lifesciences Pvt. Ltd.",
  companyLogo:    "",
  companyAddress: "",
  companyPhone:   "",
  companyEmail:   "support@bioburglifesciences.in",
  companyGST:     "",
  companyWebsite: "www.bioburglifesciences.in",
  slipTitle:      "Payment Receipt",
  slipNote:       "",
  adminSignature: "",
  designation:    "Authorized Signatory",
  paymentMode:    "Bank Transfer",
  deductions:     [],
};

// ── Slip Preview Component ──
export function SlipPreview({ slip, payoutId }) {
  const totalDeductions = (slip.deductions || []).reduce((s, d) => s + Number(d.amount || 0), 0);
  const netAmount = slip.netAmount ?? (slip.amount - totalDeductions);

  const handlePrint = () => {
    const el = document.getElementById(`slip-preview-${payoutId}`);
    if (!el) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Payment Slip</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#111}
      table{width:100%;border-collapse:collapse}td,th{border:1px solid #e5e7eb;padding:8px 12px;font-size:12px}
      th{background:#f9fafb;font-weight:700;text-align:left}
      @page{margin:15mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
      </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 400);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={handlePrint}
          style={{ padding: "6px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          🖨 Print Slip
        </button>
      </div>

      <div id={`slip-preview-${payoutId}`} style={{ padding: "32px 36px", fontFamily: "'Segoe UI',sans-serif", color: "#111827", background: "#fff" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 18, borderBottom: "2px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {slip.companyLogo && <img src={slip.companyLogo} alt="logo" style={{ height: 52, objectFit: "contain" }} />}
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1e40af" }}>{slip.companyName}</div>
              {slip.companyAddress && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{slip.companyAddress}</div>}
              {slip.companyGST     && <div style={{ fontSize: 11, color: "#6b7280" }}>GSTIN: {slip.companyGST}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#1e40af" }}>{slip.slipTitle}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Date: {slip.paidOn ? new Date(slip.paidOn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 2 }}>
              Ref: {String(slip._id || payoutId || "").slice(-8).toUpperCase()}
            </div>
            {slip.lastEditedAt && (
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                Last edited: {new Date(slip.lastEditedAt).toLocaleDateString("en-IN")}
              </div>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20, fontSize: 12, color: "#6b7280", flexWrap: "wrap" }}>
          {slip.companyPhone   && <span>📞 {slip.companyPhone}</span>}
          {slip.companyEmail   && <span>✉️ {slip.companyEmail}</span>}
          {slip.companyWebsite && <span>🌐 {slip.companyWebsite}</span>}
        </div>

        {/* Paid To */}
        <div style={{ background: "#f8fafc", borderWidth: "1.5px", borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Paid To</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{slip.agentName}</div>
          {slip.agentPhone && <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>📱 {slip.agentPhone}</div>}
        </div>

        {/* Amount breakdown */}
        <div style={{ background: "linear-gradient(135deg,#1e40af,#3730a3)", borderRadius: 10, padding: "18px 22px", marginBottom: 18, color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Gross Amount</div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{fmt(slip.amount)}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                {(slip.pointsRedeemed || 0) > 0 && <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{slip.pointsRedeemed} pts → {fmt(slip.pointsRedeemed)}</span>}
                {(slip.salaryAmount || 0) > 0   && <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Salary: {fmt(slip.salaryAmount)}</span>}
              </div>
            </div>
            {totalDeductions > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fca5a5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Net Paid</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#86efac" }}>{fmt(netAmount)}</div>
                <div style={{ fontSize: 11, color: "#fca5a5" }}>After {fmt(totalDeductions)} deductions</div>
              </div>
            )}
          </div>
        </div>

        {/* Deductions table */}
        {(slip.deductions || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Deductions</div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {slip.deductions.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{d.category}</td>
                    <td style={{ color: "#dc2626", fontWeight: 700 }}>− {fmt(d.amount)}</td>
                    <td style={{ color: "#6b7280" }}>{d.note || "—"}</td>
                  </tr>
                ))}
                <tr style={{ background: "#fef2f2" }}>
                  <td style={{ fontWeight: 800 }}>Total Deductions</td>
                  <td style={{ fontWeight: 800, color: "#dc2626" }}>− {fmt(totalDeductions)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <div style={{ background: "#f0fdf4", borderWidth: "1.5px", borderStyle: "solid", borderColor: "#86efac", borderRadius: 8, padding: "8px 20px", fontSize: 15, fontWeight: 900, color: "#059669" }}>
                Net Amount Paid: {fmt(netAmount)}
              </div>
            </div>
          </div>
        )}

        {/* Transaction info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Payment Mode",   value: slip.paymentMode   || "—" },
            { label: "Transaction ID", value: slip.transactionId || "—" },
            { label: "Payment Date",   value: slip.paidOn ? new Date(slip.paidOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
            { label: "Status",         value: "✅ Paid" },
          ].map(r => (
            <div key={r.label} style={{ padding: "10px 12px", background: "#f8fafc", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* Note */}
        {slip.slipNote && (
          <div style={{ background: "#fffbeb", borderWidth: "1.5px", borderStyle: "solid", borderColor: "#fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Message</div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{slip.slipNote}</div>
          </div>
        )}

        {/* Signature */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>System-generated receipt. No physical signature required.</div>
          {slip.adminSignature && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{slip.adminSignature}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{slip.designation}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Issue Timeline Component ──
function IssueTimeline({ issue, onReply, onStatusChange, isAdmin }) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await onReply(issue._id, reply);
    setReply("");
    setSending(false);
  };

  const sc = ISSUE_STATUS_META[issue.status] || ISSUE_STATUS_META.open;

  return (
    <div style={{ background: "#fff", borderWidth: "1.5px", borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: 14, padding: "18px 20px", marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1f2937" }}>{issue.subject}</div>
          {isAdmin && (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {issue.agentId?.name} · {issue.agentId?.phone}
              {issue.payoutId && <span style={{ marginLeft: 8, background: "#eef2ff", color: "#4338ca", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>Payout: {fmt(issue.payoutId.amountRequested)}</span>}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
            Raised {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* FIX: split border shorthand into longhands to silence React warning */}
          <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.text, borderWidth: "1px", borderStyle: "solid", borderColor: sc.border }}>
            {sc.label}
          </span>
          {isAdmin && (
            <select value={issue.status} onChange={e => onStatusChange(issue._id, e.target.value)}
              style={{ fontSize: 11, padding: "4px 8px", borderRadius: 8, borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb", fontFamily: "inherit", cursor: "pointer" }}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {(issue.timeline || []).map((entry, i) => {
          const byAdmin = entry.by === "admin";
          return (
            <div key={i} style={{ display: "flex", gap: 10, justifyContent: byAdmin ? "flex-end" : "flex-start" }}>
              {!byAdmin && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#6366f1", flexShrink: 0 }}>A</div>
              )}
              <div style={{
                maxWidth: "75%", padding: "8px 12px", borderRadius: 10,
                background: byAdmin ? "#1e1b4b" : "#f8fafc",
                borderWidth: byAdmin ? 0 : "1.5px",
                borderStyle: "solid",
                borderColor: byAdmin ? "transparent" : "#e2e8f0",
                color: byAdmin ? "#fff" : "#1f2937",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{entry.message}</div>
                <div style={{ fontSize: 10, color: byAdmin ? "#a5b4fc" : "#9ca3af", marginTop: 4 }}>
                  {byAdmin ? "Admin" : "Agent"} · {new Date(entry.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {byAdmin && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>Ad</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {issue.status !== "closed" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={reply} onChange={e => setReply(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleReply()}
            placeholder="Type a reply..."
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, borderWidth: "1.5px", borderStyle: "solid", borderColor: "#e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={handleReply} disabled={sending || !reply.trim()}
            style={{ padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: sending ? 0.7 : 1 }}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      )}
      {issue.agentConfirmedResolved && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#059669", fontWeight: 700 }}>✅ Agent confirmed this issue is resolved</div>
      )}
    </div>
  );
}

export default function AdminPointsPayout() {
  const [tab,       setTab]       = useState("payouts");
  const [payouts,   setPayouts]   = useState([]);
  const [configs,   setConfigs]   = useState([]);
  const [agents,    setAgents]    = useState([]);
  const [salaryData,setSalaryData]= useState([]);
  const [issues,    setIssues]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [actionModal,   setActionModal]   = useState(null);
  const [actionNote,    setActionNote]    = useState("");
  const [txnId,         setTxnId]         = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [slipEditorModal, setSlipEditorModal] = useState(null);
  const [slipEditing,     setSlipEditing]     = useState(false);
  const [viewSlipModal,   setViewSlipModal]   = useState(null);

  const [awardModal, setAwardModal] = useState(false);
  const [awardForm,  setAwardForm]  = useState({ agentId: "", taskKey: "", taskLabel: "", points: "", note: "", isCustomTask: false });
  const [salAdjModal, setSalAdjModal] = useState(false);
  const [salAdjForm,  setSalAdjForm]  = useState({ agentId: "", amount: "", type: "credit", note: "" });
  const [salAdjSaving,setSalAdjSaving]= useState(false);

  const [editingConfig, setEditingConfig] = useState(null);
  const [addingConfig,  setAddingConfig]  = useState(false);
  const [newConfig,     setNewConfig]     = useState({ taskKey: "", taskLabel: "", points: "", description: "" });

  const [slipForm, setSlipForm] = useState({ ...EMPTY_SLIP });
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef    = useRef();
  const editLogoInputRef = useRef();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, a, sal, iss] = await Promise.all([
        axios.get(`${API}/api/points/admin/payouts`,  { headers: adminHeaders() }),
        axios.get(`${API}/api/points/admin/config`,   { headers: adminHeaders() }),
        axios.get(`${API}/api/points/admin/agents`,   { headers: adminHeaders() }),
        axios.get(`${API}/api/salary/admin/all`,      { headers: adminHeaders() }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API}/api/points/admin/issues`,   { headers: adminHeaders() }).catch(() => ({ data: { data: [] } })),
      ]);
      setPayouts(p.data.data  || []);
      setConfigs(c.data.data?.length ? c.data.data : DEFAULT_TASK_CONFIGS);
      setAgents(a.data.data   || a.data || []);
      setSalaryData(sal.data.data || []);
      setIssues(iss.data.data || []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLogoUpload = async (e, target = "action") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      setLogoUploading(true);
      try {
        const { data } = await axios.post(
          `${API}/api/points/admin/slip/upload-logo`,
          { base64: ev.target.result },
          { headers: adminHeaders() }
        );
        if (target === "action") {
          setSlipForm(f => ({ ...f, companyLogo: data.url }));
        } else if (target === "edit") {
          setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, companyLogo: data.url } }));
        }
        toast.success("Logo uploaded!");
      } catch { toast.error("Logo upload failed"); }
      finally { setLogoUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePayoutAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await axios.patch(
        `${API}/api/points/admin/payouts/${actionModal.payout._id}`,
        {
          status:    actionModal.action,
          adminNote: actionNote,
          transactionId: txnId,
          ...(actionModal.action === "paid" ? { ...slipForm } : {}),
        },
        { headers: adminHeaders() }
      );
      toast.success(actionModal.action === "paid" ? "Payment marked & slip generated!" : `Payout ${actionModal.action}!`);
      setActionModal(null); setActionNote(""); setTxnId(""); setSlipForm({ ...EMPTY_SLIP });
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || "Action failed"); }
    finally { setActionLoading(false); }
  };

  const openSlipEditor = async (payoutId) => {
    try {
      const { data } = await axios.get(`${API}/api/points/admin/slip/${payoutId}`, { headers: adminHeaders() });
      setSlipEditorModal({ payoutId, slip: data.data });
    } catch { toast.error("Could not load slip"); }
  };

  const saveSlipEdits = async () => {
    setSlipEditing(true);
    try {
      await axios.patch(
        `${API}/api/points/admin/slip/${slipEditorModal.payoutId}`,
        slipEditorModal.slip,
        { headers: adminHeaders() }
      );
      toast.success("Slip updated! Agent will see the latest version.");
      setSlipEditorModal(null);
      fetchAll();
    } catch { toast.error("Failed to save slip"); }
    finally { setSlipEditing(false); }
  };

  const seedDefaults = async () => {
    try {
      await Promise.all(DEFAULT_TASK_CONFIGS.map(cfg => axios.post(`${API}/api/points/admin/config`, cfg, { headers: adminHeaders() })));
      toast.success("Default configs seeded!"); fetchAll();
    } catch { toast.error("Failed to seed configs"); }
  };

  const handleSaveConfig = async (cfg) => {
    try {
      await axios.post(`${API}/api/points/admin/config`, { ...cfg, points: Number(cfg.points) }, { headers: adminHeaders() });
      toast.success("Config saved!"); setEditingConfig(null); setAddingConfig(false);
      setNewConfig({ taskKey: "", taskLabel: "", points: "", description: "" }); fetchAll();
    } catch { toast.error("Failed to save config"); }
  };

  const handleDeleteConfig = async (taskKey) => {
    if (!window.confirm(`Delete config for "${taskKey}"?`)) return;
    try {
      await axios.delete(`${API}/api/points/admin/config/${taskKey}`, { headers: adminHeaders() });
      toast.success("Deleted"); fetchAll();
    } catch { toast.error("Failed to delete"); }
  };

  const handleAward = async () => {
    const taskKeyToSend = awardForm.isCustomTask
      ? (awardForm.taskKey || awardForm.taskLabel.toLowerCase().replace(/\s+/g, "_"))
      : awardForm.taskKey;
    if (!awardForm.agentId || !taskKeyToSend || !awardForm.points) { toast.error("Fill all required fields"); return; }
    try {
      await axios.post(`${API}/api/points/admin/award`, {
        agentId: awardForm.agentId, taskKey: taskKeyToSend, taskLabel: awardForm.taskLabel || taskKeyToSend,
        points: Number(awardForm.points), note: awardForm.note,
      }, { headers: adminHeaders() });
      toast.success("Points awarded!");
      setAwardModal(false); setAwardForm({ agentId: "", taskKey: "", taskLabel: "", points: "", note: "", isCustomTask: false });
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
  };

  const handleSalaryAdjust = async () => {
    const amt = parseFloat(salAdjForm.amount);
    if (!salAdjForm.agentId || !amt || amt <= 0) { toast.error("Fill all required fields"); return; }
    setSalAdjSaving(true);
    try {
      await axios.post(`${API}/api/salary/admin/adjust`, {
        agentId: salAdjForm.agentId,
        amount:  salAdjForm.type === "debit" ? -amt : amt,
        type:    salAdjForm.type,
        note:    salAdjForm.note,
      }, { headers: adminHeaders() });
      toast.success(`Salary ${salAdjForm.type === "credit" ? "credited" : "debited"}!`);
      setSalAdjModal(false); setSalAdjForm({ agentId: "", amount: "", type: "credit", note: "" });
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setSalAdjSaving(false); }
  };

  const handleAdminReply = async (issueId, message) => {
    try {
      await axios.post(`${API}/api/points/admin/issues/${issueId}/reply`, { message }, { headers: adminHeaders() });
      fetchAll();
    } catch { toast.error("Failed to send reply"); }
  };

  const handleIssueStatusChange = async (issueId, status) => {
    try {
      await axios.patch(`${API}/api/points/admin/issues/${issueId}/status`, { status }, { headers: adminHeaders() });
      toast.success("Status updated");
      fetchAll();
    } catch { toast.error("Failed to update status"); }
  };

  const addDeduction = () => setSlipForm(f => ({ ...f, deductions: [...(f.deductions || []), { category: "", amount: "", note: "" }] }));
  const updateDeduction = (i, key, val) => setSlipForm(f => ({ ...f, deductions: f.deductions.map((d, idx) => idx === i ? { ...d, [key]: val } : d) }));
  const removeDeduction = i => setSlipForm(f => ({ ...f, deductions: f.deductions.filter((_, idx) => idx !== i) }));

  const addEditDeduction = () => setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, deductions: [...(m.slip.deductions || []), { category: "", amount: "", note: "" }] } }));
  const updateEditDeduction = (i, key, val) => setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, deductions: m.slip.deductions.map((d, idx) => idx === i ? { ...d, [key]: val } : d) } }));
  const removeEditDeduction = i => setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, deductions: m.slip.deductions.filter((_, idx) => idx !== i) } }));

  const filteredPayouts = statusFilter === "all" ? payouts : payouts.filter(p => p.status === statusFilter);
  const openIssues = issues.filter(i => i.status === "open" || i.status === "in_progress").length;

  const stats = {
    total:        payouts.length,
    pending:      payouts.filter(p => p.status === "pending").length,
    approved:     payouts.filter(p => p.status === "approved").length,
    paid:         payouts.filter(p => p.status === "paid").length,
    rejected:     payouts.filter(p => p.status === "rejected").length,
    totalPaidAmt: payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amountRequested, 0),
    totalSalary:  salaryData.reduce((s, a) => s + (a.salaryBalance || 0), 0),
  };

  if (loading) return <div style={S.loading}>Loading…</div>;

  const actionDeductTotal = (slipForm.deductions || []).reduce((s, d) => s + Number(d.amount || 0), 0);
  const actionNetAmount   = actionModal ? (actionModal.payout.amountRequested - actionDeductTotal) : 0;

  return (
    <>
      <style>{`
        .ppp-page { padding: 16px; font-family: 'Segoe UI', sans-serif; }
        @media (min-width: 640px) { .ppp-page { padding: 24px; } }
        .ppp-header-row { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        @media (min-width: 640px) { .ppp-header-row { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
        .ppp-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        @media (min-width: 480px) { .ppp-stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 900px) { .ppp-stats-grid { grid-template-columns: repeat(7, 1fr); } }
        .ppp-tab-bar { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ppp-tab-bar::-webkit-scrollbar { display: none; }
        .ppp-filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .ppp-table-wrap { overflow-x: auto; }
        .ppp-table-wrap table, .ppp-salary-table-wrap table { min-width: 750px; }
        .ppp-salary-table-wrap { overflow-x: auto; }
        .ppp-mobile-cards { display: flex; flex-direction: column; gap: 12px; }
        .ppp-mobile-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
        .ppp-mobile-card-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .ppp-mobile-card-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6; }
        .ppp-show-table { display: none; }
        .ppp-show-cards { display: block; }
        @media (min-width: 768px) { .ppp-show-table { display: block; } .ppp-show-cards { display: none; } }
        .ppp-config-form { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
        .ppp-config-form .ppp-form-group { flex: 1; min-width: 140px; }
        .ppp-modal { background: #fff; border-radius: 16px; padding: 24px; width: calc(100% - 32px); max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
        .ppp-award-btn { padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px; font-family: inherit; white-space: nowrap; }
        .ppp-salary-btn { padding: 10px 20px; background: linear-gradient(135deg, #059669, #047857); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px; font-family: inherit; white-space: nowrap; }
        .upload-zone { border: 2px dashed #c7d2fe; border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; background: #eef2ff; transition: all 0.15s; }
        .upload-zone:hover { border-color: #6366f1; background: #e0e7ff; }
      `}</style>

      <input ref={logoInputRef}     type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleLogoUpload(e, "action")} />
      <input ref={editLogoInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleLogoUpload(e, "edit")} />

      <div className="ppp-page">

        {/* HEADER */}
        <div className="ppp-header-row">
          <div>
            <h2 style={S.title}>Points & Payout Management</h2>
            <p style={S.subtitle}>Manage agent rewards, salary, payout requests, and payment issues</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setAwardModal(true)}  className="ppp-award-btn">Award Points</button>
            <button onClick={() => setSalAdjModal(true)} className="ppp-salary-btn">Adjust Salary</button>
            {configs.length === 0 && <button onClick={seedDefaults} style={{ ...S.approveBtn, background: "#10b981" }}>Seed Defaults</button>}
          </div>
        </div>

        {/* STATS */}
        <div className="ppp-stats-grid">
          {[
            { label: "Total Requests",  value: stats.total,                                       color: "#6366f1" },
            { label: "Pending",         value: stats.pending,                                     color: "#f59e0b" },
            { label: "Approved",        value: stats.approved,                                    color: "#3b82f6" },
            { label: "Paid",            value: stats.paid,                                        color: "#10b981" },
            { label: "Rejected",        value: stats.rejected,                                    color: "#ef4444" },
            { label: "Total Paid",      value: `₹${stats.totalPaidAmt.toLocaleString("en-IN")}`, color: "#10b981" },
            { label: "Open Issues",     value: openIssues,                                        color: openIssues > 0 ? "#dc2626" : "#6b7280" },
          ].map(s => (
            <div key={s.label} style={{ ...S.statCard, borderTopColor: s.color }}>
              <p style={S.statLabel}>{s.label}</p>
              <p style={{ ...S.statValue, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="ppp-tab-bar">
          {[
            { id: "payouts", label: "Payout Requests" },
            { id: "salary",  label: "Salary Management" },
            { id: "config",  label: "Points Config" },
            { id: "agents",  label: "Leaderboard" },
            { id: "issues",  label: `Payment Issues${openIssues > 0 ? ` (${openIssues})` : ""}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...S.tab, ...(tab === t.id ? (t.id === "salary" ? S.tabActiveSalary : t.id === "issues" ? { color: "#dc2626", borderBottomColor: "#dc2626", background: "#fef2f2" } : S.tabActive) : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PAYOUTS TAB ── */}
        {tab === "payouts" && (
          <div style={S.card}>
            <div className="ppp-filter-row">
              {["all", "pending", "approved", "paid", "rejected"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ ...S.filterBtn, ...(statusFilter === s ? S.filterBtnActive : {}) }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} ({s === "all" ? payouts.length : payouts.filter(p => p.status === s).length})
                </button>
              ))}
            </div>

            {filteredPayouts.length === 0 ? (
              <div style={S.empty}>No payout requests found.</div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="ppp-show-cards">
                  <div className="ppp-mobile-cards">
                    {filteredPayouts.map(p => {
                      const sc = STATUS_META[p.status] || STATUS_META.pending;
                      const bd = p.bankDetails || {};
                      return (
                        <div key={p._id} className="ppp-mobile-card">
                          <div className="ppp-mobile-card-row">
                            <div>
                              <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>{getAgentName(p)}</p>
                              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{getAgentPhone(p)}</p>
                            </div>
                            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.text, borderWidth: "1px", borderStyle: "solid", borderColor: sc.border, textTransform: "uppercase" }}>{p.status}</span>
                          </div>
                          <p style={{ fontSize: 22, fontWeight: 900, color: "#1f2937", margin: "0 0 4px" }}>₹{p.amountRequested.toFixed(2)}</p>
                          <div style={{ fontSize: 12, color: "#374151" }}>
                            {bd.upiId ? `UPI: ${bd.upiId}` : bd.bankName ? `${bd.bankName} · ****${bd.accountNumber?.slice(-4)}` : "—"}
                          </div>
                          <div className="ppp-mobile-card-actions">
                            {p.status === "pending"  && <><button onClick={() => setActionModal({ payout: p, action: "approved" })} style={S.approveBtn}>✓ Approve</button><button onClick={() => setActionModal({ payout: p, action: "rejected" })} style={S.rejectBtn}>✗ Reject</button></>}
                            {p.status === "approved" && <button onClick={() => setActionModal({ payout: p, action: "paid" })} style={S.paidBtn}>Mark Paid</button>}
                            {p.status === "paid"     && <button onClick={() => openSlipEditor(p._id)} style={{ ...S.paidBtn, background: "#6366f1" }}>Edit Slip</button>}
                            {p.status === "paid"     && <button onClick={async () => { try { const { data } = await axios.get(`${API}/api/points/admin/slip/${p._id}`, { headers: adminHeaders() }); setViewSlipModal({ slip: data.data, payoutId: p._id }); } catch { toast.error("Slip not found"); } }} style={{ ...S.approveBtn, background: "#0891b2" }}>👁 View Slip</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop table */}
                <div className="ppp-show-table">
                  <div className="ppp-table-wrap">
                    <table style={S.table}>
                      <thead>
                        <tr style={S.thead}>
                          {["Agent", "Amount", "Breakdown", "Payment Info", "Requested", "Status", "Actions"].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayouts.map(p => {
                          const sc    = STATUS_META[p.status] || STATUS_META.pending;
                          const bd    = p.bankDetails || {};
                          const hasSalary = (p.salaryAmount || 0) > 0;
                          const hasPoints = (p.pointsRedeemed || 0) > 0;
                          return (
                            <tr key={p._id} style={S.tr}>
                              <td style={S.td}>
                                <p style={{ fontWeight: 700, margin: 0 }}>{getAgentName(p)}</p>
                                <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{getAgentPhone(p)}</p>
                              </td>
                              <td style={{ ...S.td, fontWeight: 800, color: "#10b981", fontSize: 18 }}>₹{p.amountRequested.toFixed(2)}</td>
                              <td style={S.td}>
                                {hasPoints && <span style={{ fontSize: 11, background: "#eef2ff", color: "#4338ca", borderRadius: 20, padding: "2px 8px", fontWeight: 700, display: "inline-block", marginBottom: 4 }}>{p.pointsRedeemed} pts</span>}
                                {hasSalary && <span style={{ fontSize: 11, background: "#f0fdf4", color: "#15803d", borderRadius: 20, padding: "2px 8px", fontWeight: 700, display: "inline-block" }}>{fmt(p.salaryAmount)} salary</span>}
                              </td>
                              <td style={S.td}>
                                {bd.upiId
                                  ? <p style={{ fontSize: 13, margin: 0 }}>UPI: {bd.upiId}</p>
                                  : <><p style={{ fontSize: 12, margin: 0, fontWeight: 600 }}>{bd.bankName}</p><p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>****{bd.accountNumber?.slice(-4)}</p></>
                                }
                              </td>
                              <td style={{ ...S.td, fontSize: 12, color: "#6b7280" }}>
                                {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td style={S.td}>
                                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.text, borderWidth: "1px", borderStyle: "solid", borderColor: sc.border, textTransform: "uppercase" }}>{p.status}</span>
                                {p.transactionId && <p style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Txn: {p.transactionId}</p>}
                              </td>
                              <td style={S.td}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {p.status === "pending"  && <><button onClick={() => setActionModal({ payout: p, action: "approved" })} style={S.approveBtn}>✓ Approve</button><button onClick={() => setActionModal({ payout: p, action: "rejected" })} style={S.rejectBtn}>✗ Reject</button></>}
                                  {p.status === "approved" && <button onClick={() => setActionModal({ payout: p, action: "paid" })} style={S.paidBtn}>Mark Paid</button>}
                                  {p.status === "paid"     && <button onClick={() => openSlipEditor(p._id)} style={{ ...S.paidBtn, background: "#6366f1" }}> Edit Slip</button>}
                                  {p.status === "paid"     && <button onClick={async () => { try { const { data } = await axios.get(`${API}/api/points/admin/slip/${p._id}`, { headers: adminHeaders() }); setViewSlipModal({ slip: data.data, payoutId: p._id }); } catch { toast.error("Slip not found"); } }} style={{ ...S.approveBtn, background: "#0891b2" }}>👁 View</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SALARY TAB ── */}
        {tab === "salary" && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 16, padding: "20px 24px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Salary Balance Management</div>
                <div style={{ fontSize: 13, color: "#a7f3d0", lineHeight: 1.6 }}>Salary credits auto from approved expenses. Manual adjustments for bonuses/deductions.</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#6ee7b7", fontWeight: 700, textTransform: "uppercase" }}>Total Outstanding</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{fmt(stats.totalSalary)}</div>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Agent Salary Balances</h3>
                <button onClick={() => setSalAdjModal(true)} className="ppp-salary-btn">+ Adjust Salary</button>
              </div>
              <div className="ppp-show-table">
                <div className="ppp-salary-table-wrap">
                  <table style={S.table}>
                    <thead>
                      <tr style={S.thead}>
                        {["Agent", "Phone", "Salary Balance", "Total Earned", "Total Paid Out", "Transactions", "Action"].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(salaryData.length ? salaryData : agents.map(a => ({ agentId: a.agentId || a._id, name: a.name, phone: a.phone, salaryBalance: 0, totalEarned: 0, totalPaid: 0, txnCount: 0 }))).map(a => (
                        <tr key={a.agentId} style={S.tr}>
                          <td style={{ ...S.td, fontWeight: 700 }}>{a.name || "—"}</td>
                          <td style={S.td}>{a.phone || "—"}</td>
                          <td style={{ ...S.td, fontWeight: 900, color: (a.salaryBalance || 0) > 0 ? "#059669" : "#6b7280", fontSize: 16 }}>{fmt(a.salaryBalance || 0)}</td>
                          <td style={{ ...S.td, fontWeight: 700, color: "#16a34a" }}>{fmt(a.totalEarned || 0)}</td>
                          <td style={{ ...S.td, fontWeight: 700, color: "#ef4444" }}>{fmt(a.totalPaid || 0)}</td>
                          <td style={{ ...S.td, color: "#6b7280" }}>{a.txnCount || 0}</td>
                          <td style={S.td}>
                            <button onClick={() => { setSalAdjForm(f => ({ ...f, agentId: a.agentId })); setSalAdjModal(true); }} className="ppp-salary-btn" style={{ fontSize: 12, padding: "7px 14px" }}>Adjust</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
              <div style={{ background: "#f9fafb", borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 12px" }}>New Task Config</h4>
                <div className="ppp-config-form">
                  <div style={S.formGroup}><label style={S.label}>Task Key</label><input value={newConfig.taskKey} onChange={e => setNewConfig({ ...newConfig, taskKey: e.target.value })} placeholder="e.g. lead_submitted" style={S.input} /></div>
                  <div style={S.formGroup}><label style={S.label}>Label</label><input value={newConfig.taskLabel} onChange={e => setNewConfig({ ...newConfig, taskLabel: e.target.value })} placeholder="Lead Submitted" style={S.input} /></div>
                  <div style={{ ...S.formGroup, minWidth: 80, flex: "0 0 80px" }}><label style={S.label}>Points</label><input type="number" value={newConfig.points} onChange={e => setNewConfig({ ...newConfig, points: e.target.value })} style={S.input} /></div>
                  <div style={S.formGroup}><label style={S.label}>Description</label><input value={newConfig.description} onChange={e => setNewConfig({ ...newConfig, description: e.target.value })} style={S.input} /></div>
                  <button onClick={() => handleSaveConfig(newConfig)} style={S.approveBtn}>Save</button>
                  <button onClick={() => setAddingConfig(false)} style={S.rejectBtn}>Cancel</button>
                </div>
              </div>
            )}
            {configs.map(cfg => (
              <div key={cfg.taskKey} style={{ padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}>
                {editingConfig?.taskKey === cfg.taskKey ? (
                  <div className="ppp-config-form">
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#6b7280", alignSelf: "center", minWidth: 120 }}>{cfg.taskKey}</span>
                    <input value={editingConfig.taskLabel} onChange={e => setEditingConfig({ ...editingConfig, taskLabel: e.target.value })} style={{ ...S.input, flex: 1 }} />
                    <input type="number" value={editingConfig.points} onChange={e => setEditingConfig({ ...editingConfig, points: Number(e.target.value) })} style={{ ...S.input, width: 80 }} />
                    <button onClick={() => handleSaveConfig(editingConfig)} style={S.approveBtn}>Save</button>
                    <button onClick={() => setEditingConfig(null)} style={S.rejectBtn}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <p style={{ fontWeight: 700, color: "#111827", margin: 0 }}>{cfg.taskLabel}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", fontFamily: "monospace" }}>{cfg.taskKey}</p>
                    </div>
                    <div style={{ background: "#EEF2FF", color: "#6366f1", padding: "4px 14px", borderRadius: 20, fontSize: 14, fontWeight: 800 }}>{cfg.points} pts</div>
                    <button onClick={() => setEditingConfig({ ...cfg })} style={{ padding: "5px 12px", background: "#FFFBEB", color: "#d97706", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Edit</button>
                    <button onClick={() => handleDeleteConfig(cfg.taskKey)} style={{ padding: "5px 12px", background: "#FEF2F2", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── AGENTS TAB ── */}
        {tab === "agents" && (
          <div style={S.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Agent Points Leaderboard</h3>
            <div className="ppp-show-table">
              <div className="ppp-table-wrap">
                <table style={S.table}>
                  <thead>
                    <tr style={S.thead}>
                      {["#", "Agent", "Phone", "Pts Balance", "Total Earned", "Total Redeemed", "Salary Balance", "Actions"].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a, i) => {
                      const salInfo = salaryData.find(s => s.agentId === (a.agentId || a._id));
                      return (
                        <tr key={a.agentId} style={S.tr}>
                          <td style={{ ...S.td, fontWeight: 700, color: "#6366f1" }}>#{i + 1}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{a.name || "—"}</td>
                          <td style={S.td}>{a.phone || "—"}</td>
                          <td style={{ ...S.td, fontWeight: 800, color: "#10b981", fontSize: 18 }}>{a.totalPoints}</td>
                          <td style={{ ...S.td, color: "#6366f1", fontWeight: 700 }}>{a.totalEarned}</td>
                          <td style={{ ...S.td, color: "#ef4444", fontWeight: 700 }}>{a.totalRedeemed}</td>
                          <td style={{ ...S.td, fontWeight: 800, color: (salInfo?.salaryBalance || 0) > 0 ? "#059669" : "#9ca3af" }}>{fmt(salInfo?.salaryBalance || 0)}</td>
                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => { setAwardForm({ ...awardForm, agentId: a.agentId }); setAwardModal(true); }} style={{ ...S.approveBtn, fontSize: 11, padding: "6px 10px" }}>Award</button>
                              <button onClick={() => { setSalAdjForm(f => ({ ...f, agentId: a.agentId || a._id })); setSalAdjModal(true); }} className="ppp-salary-btn" style={{ fontSize: 11, padding: "6px 10px" }}>Salary</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ISSUES TAB ── */}
        {tab === "issues" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111827" }}>Payment Issues</h3>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Agents raise issues here — reply and resolve in real time</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["all", "open", "in_progress", "resolved", "closed"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s === "all" ? "all_issues" : s)}
                    style={{ ...S.filterBtn, fontSize: 11, ...(statusFilter === s || (s === "all" && statusFilter === "all_issues") ? S.filterBtnActive : {}) }}>
                    {s === "all" ? "All" : ISSUE_STATUS_META[s]?.label}
                  </button>
                ))}
              </div>
            </div>
            {issues.length === 0 ? (
              <div style={{ ...S.empty, background: "#fff", borderRadius: 16, borderWidth: "1px", borderStyle: "solid", borderColor: "#f0f0f0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#374151" }}>No payment issues raised</div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Agents can raise issues from their Payout History tab</div>
              </div>
            ) : (
              issues
                .filter(i => !statusFilter || statusFilter === "all_issues" || i.status === statusFilter)
                .map(issue => (
                  <IssueTimeline
                    key={issue._id}
                    issue={issue}
                    isAdmin={true}
                    onReply={handleAdminReply}
                    onStatusChange={handleIssueStatusChange}
                  />
                ))
            )}
          </div>
        )}

        {/* ── ACTION MODAL ── */}
        {actionModal && (
          <div style={S.overlay}>
            <div className="ppp-modal" style={{ maxWidth: actionModal.action === "paid" ? 700 : 500 }}>
              <h3 style={{ margin: "0 0 4px" }}>
                {actionModal.action === "approved" ? "✓ Approve Payout"
                  : actionModal.action === "rejected" ? "✗ Reject Payout"
                  : "Mark as Paid & Generate Slip"}
              </h3>
              <p style={{ fontSize: 13, color: "#374151", margin: "0 0 16px" }}>
                <strong>{getAgentName(actionModal.payout)}</strong> — ₹{actionModal.payout.amountRequested.toFixed(2)}
              </p>

              {actionModal.action === "paid" && (
                <>
                  <div style={S.formGroup}>
                    <label style={S.label}>Transaction ID / UTR *</label>
                    <input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="UTR / TXN number" style={S.input} />
                  </div>

                  <div style={{ marginTop: 16, padding: "14px 16px", background: "#fef2f2", borderRadius: 10, borderWidth: "1px", borderStyle: "solid", borderColor: "#fecdd3" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: 1 }}>Deductions (optional)</div>
                      <button onClick={addDeduction} style={{ fontSize: 11, padding: "4px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>+ Add</button>
                    </div>
                    {(slipForm.deductions || []).length === 0 ? (
                      <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "8px 0" }}>No deductions. Click + Add to deduct TDS, advance, penalty, etc.</div>
                    ) : (
                      (slipForm.deductions || []).map((d, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                          <input value={d.category} onChange={e => updateDeduction(i, "category", e.target.value)} placeholder="Category (e.g. TDS)" style={{ ...S.input, fontSize: 12 }} />
                          <input type="number" value={d.amount} onChange={e => updateDeduction(i, "amount", e.target.value)} placeholder="₹ Amount" style={{ ...S.input, fontSize: 12 }} />
                          <input value={d.note} onChange={e => updateDeduction(i, "note", e.target.value)} placeholder="Note (optional)" style={{ ...S.input, fontSize: 12 }} />
                          <button onClick={() => removeDeduction(i)} style={{ padding: "6px 10px", background: "#fef2f2", color: "#dc2626", borderWidth: "1px", borderStyle: "solid", borderColor: "#fecdd3", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✕</button>
                        </div>
                      ))
                    )}
                    {(slipForm.deductions || []).length > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "8px 12px", background: "#fff", borderRadius: 8, borderWidth: "1px", borderStyle: "solid", borderColor: "#fecdd3" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>Total Deductions: {fmt(actionDeductTotal)}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>Net Amount: {fmt(actionNetAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 16, padding: "16px", background: "#f8fafc", borderRadius: 12, borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Payment Slip Details</div>
                    <div style={S.formGroup}>
                      <label style={S.label}>Company Logo</label>
                      {slipForm.companyLogo ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img src={slipForm.companyLogo} alt="logo" style={{ height: 40, objectFit: "contain", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: 6 }} />
                          <button onClick={() => setSlipForm(f => ({ ...f, companyLogo: "" }))} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Remove</button>
                          <button onClick={() => logoInputRef.current?.click()} style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Change</button>
                        </div>
                      ) : (
                        <div className="upload-zone" onClick={() => logoInputRef.current?.click()}>
                          {logoUploading ? <span style={{ fontSize: 13, color: "#6366f1" }}>Uploading…</span> : <><div style={{ fontSize: 24, marginBottom: 4 }}>📁</div><div style={{ fontSize: 12, fontWeight: 700, color: "#4338ca" }}>Click to upload logo</div></>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      {[
                        { label: "Company Name",  key: "companyName",    placeholder: "BioBurg Lifesciences" },
                        { label: "Slip Title",    key: "slipTitle",      placeholder: "Payment Receipt" },
                        { label: "Company Phone", key: "companyPhone",   placeholder: "+91 99999 99999" },
                        { label: "Company Email", key: "companyEmail",   placeholder: "support@company.com" },
                        { label: "GST Number",    key: "companyGST",     placeholder: "GSTIN" },
                        { label: "Website",       key: "companyWebsite", placeholder: "www.company.com" },
                        { label: "Payment Mode",  key: "paymentMode",    placeholder: "NEFT / UPI / Cheque" },
                        { label: "Signed By",     key: "adminSignature", placeholder: "Manager name" },
                        { label: "Designation",   key: "designation",    placeholder: "Authorized Signatory" },
                      ].map(f => (
                        <div key={f.key} style={{ ...S.formGroup, gridColumn: f.key === "companyAddress" || f.key === "slipNote" || f.key === "designation" ? "1/-1" : undefined }}>
                          <label style={S.label}>{f.label}</label>
                          <input value={slipForm[f.key] || ""} onChange={e => setSlipForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={S.input} />
                        </div>
                      ))}
                      <div style={{ ...S.formGroup, gridColumn: "1/-1" }}>
                        <label style={S.label}>Company Address</label>
                        <input value={slipForm.companyAddress || ""} onChange={e => setSlipForm(p => ({ ...p, companyAddress: e.target.value }))} placeholder="Full address" style={S.input} />
                      </div>
                      <div style={{ ...S.formGroup, gridColumn: "1/-1" }}>
                        <label style={S.label}>Custom Note to Agent</label>
                        <textarea value={slipForm.slipNote || ""} onChange={e => setSlipForm(p => ({ ...p, slipNote: e.target.value }))} style={{ ...S.input, minHeight: 60, resize: "vertical" }} placeholder="e.g. Thank you for your excellent performance!" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ ...S.formGroup, marginTop: 12 }}>
                <label style={S.label}>Admin Note {actionModal.action === "rejected" ? "(required)" : "(optional)"}</label>
                <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Add a note…" style={{ ...S.input, minHeight: 80, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={handlePayoutAction} disabled={actionLoading} style={{ ...S.approveBtn, opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? "Processing…" : actionModal.action === "paid" ? "Confirm & Generate Slip" : "Confirm"}
                </button>
                <button onClick={() => { setActionModal(null); setActionNote(""); setTxnId(""); setSlipForm({ ...EMPTY_SLIP }); }} style={S.cancelBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── SLIP EDITOR MODAL ── */}
        {slipEditorModal && (
          <div style={S.overlay}>
            <div style={{ ...S.overlay, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", paddingTop: 40 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "calc(100% - 32px)", maxWidth: 720, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Edit Payment Slip</h3>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Changes reflect on agent's slip immediately</div>
                </div>
                <div style={{ ...S.formGroup, marginBottom: 16 }}>
                  <label style={S.label}>Company Logo</label>
                  {slipEditorModal.slip.companyLogo ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={slipEditorModal.slip.companyLogo} alt="logo" style={{ height: 44, objectFit: "contain", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: 6 }} />
                      <button onClick={() => setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, companyLogo: "" } }))} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Remove</button>
                      <button onClick={() => editLogoInputRef.current?.click()} style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Change</button>
                    </div>
                  ) : (
                    <div className="upload-zone" onClick={() => editLogoInputRef.current?.click()}>
                      {logoUploading ? "Uploading…" : <><div style={{ fontSize: 24, marginBottom: 4 }}>📁</div><div style={{ fontSize: 12, fontWeight: 700, color: "#4338ca" }}>Upload Logo</div></>}
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Company Name",   key: "companyName" },
                    { label: "Slip Title",     key: "slipTitle" },
                    { label: "Company Phone",  key: "companyPhone" },
                    { label: "Company Email",  key: "companyEmail" },
                    { label: "GST Number",     key: "companyGST" },
                    { label: "Website",        key: "companyWebsite" },
                    { label: "Payment Mode",   key: "paymentMode" },
                    { label: "Transaction ID", key: "transactionId" },
                    { label: "Signed By",      key: "adminSignature" },
                    { label: "Designation",    key: "designation" },
                  ].map(f => (
                    <div key={f.key} style={S.formGroup}>
                      <label style={S.label}>{f.label}</label>
                      <input value={slipEditorModal.slip[f.key] || ""} onChange={e => setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, [f.key]: e.target.value } }))} style={S.input} />
                    </div>
                  ))}
                  <div style={{ ...S.formGroup, gridColumn: "1/-1" }}>
                    <label style={S.label}>Company Address</label>
                    <input value={slipEditorModal.slip.companyAddress || ""} onChange={e => setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, companyAddress: e.target.value } }))} style={S.input} />
                  </div>
                  <div style={{ ...S.formGroup, gridColumn: "1/-1" }}>
                    <label style={S.label}>Custom Note to Agent</label>
                    <textarea value={slipEditorModal.slip.slipNote || ""} onChange={e => setSlipEditorModal(m => ({ ...m, slip: { ...m.slip, slipNote: e.target.value } }))} style={{ ...S.input, minHeight: 70, resize: "vertical" }} />
                  </div>
                </div>
                <div style={{ background: "#fef2f2", borderRadius: 10, padding: "14px 16px", borderWidth: "1px", borderStyle: "solid", borderColor: "#fecdd3", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: 1 }}>Deductions</div>
                    <button onClick={addEditDeduction} style={{ fontSize: 11, padding: "4px 10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>+ Add</button>
                  </div>
                  {(slipEditorModal.slip.deductions || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "8px 0" }}>No deductions yet</div>
                  ) : (
                    (slipEditorModal.slip.deductions || []).map((d, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <input value={d.category} onChange={e => updateEditDeduction(i, "category", e.target.value)} placeholder="Category" style={{ ...S.input, fontSize: 12 }} />
                        <input type="number" value={d.amount} onChange={e => updateEditDeduction(i, "amount", e.target.value)} placeholder="₹" style={{ ...S.input, fontSize: 12 }} />
                        <input value={d.note} onChange={e => updateEditDeduction(i, "note", e.target.value)} placeholder="Note" style={{ ...S.input, fontSize: 12 }} />
                        <button onClick={() => removeEditDeduction(i)} style={{ padding: "6px 10px", background: "#fef2f2", color: "#dc2626", borderWidth: "1px", borderStyle: "solid", borderColor: "#fecdd3", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>✕</button>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ background: "#f8fafc", borderWidth: "1px", borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: 400, overflowY: "auto" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Live Preview</div>
                  <SlipPreview slip={slipEditorModal.slip} payoutId={slipEditorModal.payoutId} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveSlipEdits} disabled={slipEditing}
                    style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: slipEditing ? 0.7 : 1, fontFamily: "inherit" }}>
                    {slipEditing ? "Saving…" : "Save Changes — Agent Sees Updates Instantly"}
                  </button>
                  <button onClick={() => setSlipEditorModal(null)} style={S.cancelBtn}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW SLIP MODAL ── */}
        {viewSlipModal && (
          <div style={S.overlay}>
            <div style={{ background: "#fff", borderRadius: 16, width: "calc(100% - 32px)", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#0f172a", borderRadius: "16px 16px 0 0" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>📄 Payment Slip</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setViewSlipModal(null); openSlipEditor(viewSlipModal.payoutId); }} style={{ padding: "6px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => setViewSlipModal(null)} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✕ Close</button>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <SlipPreview slip={viewSlipModal.slip} payoutId={viewSlipModal.payoutId} />
              </div>
            </div>
          </div>
        )}

        {/* ── SALARY ADJUSTMENT MODAL ── */}
        {salAdjModal && (
          <div style={S.overlay}>
            <div className="ppp-modal">
              <h3 style={{ margin: "0 0 16px" }}>Adjust Agent Salary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.formGroup}>
                  <label style={S.label}>Select Agent *</label>
                  <select value={salAdjForm.agentId} onChange={e => setSalAdjForm(f => ({ ...f, agentId: e.target.value }))} style={S.input}>
                    <option value="">-- Select Agent --</option>
                    {agents.map(a => <option key={a.agentId || a._id} value={a.agentId || a._id}>{a.name} ({a.phone})</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Adjustment Type *</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["credit","Credit (Add)"],["debit","Debit (Deduct)"]].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setSalAdjForm(f => ({ ...f, type: v }))}
                        style={{ flex: 1, padding: "10px", borderWidth: "2px", borderStyle: "solid", borderColor: salAdjForm.type === v ? (v === "credit" ? "#059669" : "#ef4444") : "#e5e7eb", background: salAdjForm.type === v ? (v === "credit" ? "#f0fdf4" : "#fef2f2") : "#fff", color: salAdjForm.type === v ? (v === "credit" ? "#059669" : "#ef4444") : "#6b7280", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        {v === "credit" ? "+" : "-"} {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={S.formGroup}><label style={S.label}>Amount (₹) *</label><input type="number" value={salAdjForm.amount} onChange={e => setSalAdjForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter amount" style={S.input} /></div>
                <div style={S.formGroup}><label style={S.label}>Reason / Note *</label><textarea value={salAdjForm.note} onChange={e => setSalAdjForm(f => ({ ...f, note: e.target.value }))} style={{ ...S.input, minHeight: 80, resize: "vertical" }} placeholder="e.g. Performance bonus, advance deduction…" /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={handleSalaryAdjust} disabled={salAdjSaving}
                  style={{ ...S.approveBtn, background: salAdjForm.type === "credit" ? "#059669" : "#ef4444", opacity: salAdjSaving ? 0.7 : 1 }}>
                  {salAdjSaving ? "Saving…" : `Confirm ${salAdjForm.type === "credit" ? "Credit" : "Debit"}`}
                </button>
                <button onClick={() => { setSalAdjModal(false); setSalAdjForm({ agentId: "", amount: "", type: "credit", note: "" }); }} style={S.cancelBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── AWARD POINTS MODAL ── */}
        {awardModal && (
          <div style={S.overlay}>
            <div className="ppp-modal">
              <h3 style={{ margin: "0 0 16px" }}>Manually Award Points</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={S.formGroup}>
                  <label style={S.label}>Select Agent *</label>
                  <select value={awardForm.agentId} onChange={e => setAwardForm({ ...awardForm, agentId: e.target.value })} style={S.input}>
                    <option value="">-- Select Agent --</option>
                    {agents.map(a => <option key={a.agentId || a._id} value={a.agentId || a._id}>{a.name} ({a.phone})</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label style={S.label}>Task *</label>
                    <button type="button" onClick={() => setAwardForm({ ...awardForm, isCustomTask: !awardForm.isCustomTask, taskKey: "", taskLabel: "", points: "" })}
                      style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {awardForm.isCustomTask ? "← Pick from list" : "+ Custom Task"}
                    </button>
                  </div>
                  {awardForm.isCustomTask
                    ? <input value={awardForm.taskLabel} onChange={e => setAwardForm({ ...awardForm, taskLabel: e.target.value, taskKey: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="Custom task name" style={S.input} />
                    : <select value={awardForm.taskKey} onChange={e => { const cfg = configs.find(c => c.taskKey === e.target.value); setAwardForm({ ...awardForm, taskKey: e.target.value, taskLabel: cfg?.taskLabel || "", points: cfg?.points?.toString() || "" }); }} style={S.input}>
                        <option value="">-- Select Task --</option>
                        {configs.map(c => <option key={c.taskKey} value={c.taskKey}>{c.taskLabel} ({c.points} pts)</option>)}
                      </select>
                  }
                </div>
                <div style={S.formGroup}><label style={S.label}>Points *</label><input type="number" value={awardForm.points} onChange={e => setAwardForm({ ...awardForm, points: e.target.value })} placeholder="Points amount" style={S.input} /></div>
                <div style={S.formGroup}><label style={S.label}>Note</label><input value={awardForm.note} onChange={e => setAwardForm({ ...awardForm, note: e.target.value })} placeholder="Reason…" style={S.input} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={handleAward} style={S.approveBtn}>Award Points</button>
                <button onClick={() => { setAwardModal(false); setAwardForm({ agentId: "", taskKey: "", taskLabel: "", points: "", note: "", isCustomTask: false }); }} style={S.cancelBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

const S = {
  loading:        { padding: 40, textAlign: "center", color: "#6b7280" },
  title:          { fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 },
  subtitle:       { fontSize: 13, color: "#6b7280", marginTop: 4 },
  statCard:       { background: "#fff", borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb", borderTopWidth: 3, borderRadius: 12, padding: "12px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  statLabel:      { fontSize: 10, color: "#6b7280", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" },
  statValue:      { fontSize: 20, fontWeight: 800, margin: 0 },
  // FIX: borderBottom shorthand → three longhands so React can patch borderBottomColor without warning
  tab:            { padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6b7280", borderBottomWidth: "3px", borderBottomStyle: "solid", borderBottomColor: "transparent", marginBottom: -2, borderRadius: "8px 8px 0 0", transition: "all 0.15s", fontFamily: "inherit", whiteSpace: "nowrap" },
  tabActive:      { color: "#6366f1", borderBottomColor: "#6366f1", background: "#EEF2FF" },
  tabActiveSalary:{ color: "#059669", borderBottomColor: "#059669", background: "#f0fdf4" },
  card:           { background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", borderWidth: "1px", borderStyle: "solid", borderColor: "#f0f0f0" },
  filterBtn:      { padding: "6px 12px", borderRadius: 20, borderWidth: "1.5px", borderStyle: "solid", borderColor: "#e5e7eb", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#6b7280", fontFamily: "inherit", whiteSpace: "nowrap" },
  filterBtnActive:{ background: "#EEF2FF", color: "#6366f1", borderColor: "#6366f1" },
  table:          { width: "100%", borderCollapse: "collapse" },
  thead:          { background: "#f9fafb" },
  th:             { padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "#e5e7eb" },
  tr:             { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "#f3f4f6" },
  td:             { padding: "12px 14px", fontSize: 13, color: "#374151", verticalAlign: "middle" },
  approveBtn:     { padding: "8px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" },
  rejectBtn:      { padding: "8px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" },
  paidBtn:        { padding: "8px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" },
  cancelBtn:      { padding: "10px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  empty:          { padding: "40px 20px", textAlign: "center", color: "#9ca3af" },
  overlay:        { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  formGroup:      { display: "flex", flexDirection: "column", gap: 6 },
  label:          { fontSize: 12, fontWeight: 700, color: "#374151" },
  input:          { padding: "9px 12px", borderRadius: 8, borderWidth: "1.5px", borderStyle: "solid", borderColor: "#e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
};