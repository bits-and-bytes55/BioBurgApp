import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const API = API_BASE_URL;

const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const fmtLong = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(0, Math.ceil((new Date(b) - new Date(a)) / 86400000) + 1);
};

const STATUS = {
  pending:  { bg: "#fefce8", color: "#b45309", dot: "#f59e0b", label: "Pending" },
  approved: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", label: "Approved" },
  rejected: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "Rejected" },
};

const LEAVE_LABELS = {
  EL: "Earned Leave", CL: "Casual Leave", SL: "Sick Leave",
  ML: "Medical Leave", MAL: "Maternity", PL: "Paternity",
  CO: "Comp-Off", LWP: "Leave Without Pay",
};

const LEAVE_COLORS = {
  EL: "#6366f1", CL: "#0ea5e9", SL: "#f59e0b", ML: "#ef4444",
  MAL: "#ec4899", PL: "#8b5cf6", CO: "#14b8a6", LWP: "#64748b",
};

const StatusPill = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: s.bg, fontSize: 11, fontWeight: 700, color: s.color }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
};

const Stat = ({ label, value, color = "#1e293b", sub }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: `3px solid ${color}`, borderRadius: 12, padding: "14px 16px", minWidth: 110 }}>
    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</p>
    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value ?? "—"}</p>
    {sub && <p style={{ margin: "3px 0 0", fontSize: 10.5, color: "#94a3b8" }}>{sub}</p>}
  </div>
);

function RejectModal({ leave, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  if (!leave) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Reject Leave Request</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
        </div>

        <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#991b1b" }}>
            {leave.name || leave.agentId?.name || "Agent"} · {LEAVE_LABELS[leave.leaveType] || leave.leaveType}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#b91c1c" }}>
            {fmt(leave.fromDate)} → {fmt(leave.toDate)} · {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
          </p>
        </div>

        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
          Reason for Rejection <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explain why this leave is being rejected…"
          style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit", minHeight: 90, resize: "vertical", boxSizing: "border-box", marginBottom: 16 }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: "#f3f4f6", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!reason.trim()) { toast.error("Please provide a rejection reason"); return; }
              setLoading(true);
              await onConfirm(leave._id, "rejected", reason.trim());
              setLoading(false);
            }}
            disabled={loading}
            style={{ flex: 2, padding: "10px 0", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}


function DetailModal({ leave, onClose, onApprove, onReject }) {
  if (!leave) return null;
  const sc = STATUS[leave.status] || STATUS.pending;
  const agentName = leave.name || leave.agentId?.name || "—";

  const Row = ({ label, val }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: "#1e293b", fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{val || "—"}</span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, padding: 24, margin: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Leave Application</h3>
            <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8" }}>Submitted {fmtLong(leave.createdAt)}</p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
        </div>

        <StatusPill status={leave.status} />

        {/* rejection reason shown to admin */}
        {leave.status === "rejected" && leave.adminRemark && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: "#991b1b" }}>Rejection Reason</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#b91c1c" }}>{leave.adminRemark}</p>
          </div>
        )}
        {leave.status === "approved" && leave.adminRemark && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "10px 14px", marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: "#15803d" }}>Admin Remark</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#166534" }}>{leave.adminRemark}</p>
          </div>
        )}

        {/* Employee info */}
        <div style={{ marginTop: 18, marginBottom: 6, fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>👤 Employee</div>
        <Row label="Name"           val={agentName} />
        <Row label="Enrol ID"       val={leave.enrollId} />
        <Row label="Designation"    val={leave.designation} />
        <Row label="Employment"     val={leave.employmentType} />
        <Row label="Working Address" val={leave.workingAddress} />
        <Row label="Date of Joining" val={fmt(leave.dateJoining)} />
        <Row label="Aadhar"         val={leave.aadharNo} />
        <Row label="PAN"            val={leave.panNo} />
        <Row label="PPA No"         val={leave.ppaNo} />
        <Row label="Level"          val={leave.level} />

        <div style={{ marginTop: 18, marginBottom: 6, fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>📅 Leave Details</div>
        <Row label="Leave Type"  val={LEAVE_LABELS[leave.leaveType] || leave.leaveType} />
        <Row label="From"        val={fmt(leave.fromDate)} />
        <Row label="To"          val={fmt(leave.toDate)} />
        <Row label="Total Days"  val={`${leave.totalDays} day${leave.totalDays !== 1 ? "s" : ""}${leave.halfDay ? ` (Half-Day · ${leave.halfDaySession})` : ""}`} />
        <Row label="Reason"      val={leave.reason} />
        {leave.othersInfo && <Row label="Others Info" val={leave.othersInfo} />}
        {leave.remarks     && <Row label="Remarks"    val={leave.remarks} />}

        <div style={{ marginTop: 18, marginBottom: 6, fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>🏠 Address During Leave</div>
        <Row label="Type"    val={leave.leaveAddressType} />
        <Row label="Address" val={leave.leaveAddress} />
        <Row label="Contact" val={leave.leaveAddressContact} />

        {/* documents */}
        {(leave.medicalCertificate || leave.supportDocument) && (
          <>
            <div style={{ marginTop: 18, marginBottom: 8, fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>📎 Documents</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {leave.medicalCertificate && (
                <a href={leave.medicalCertificate} target="_blank" rel="noreferrer"
                  style={{ padding: "7px 16px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  📋 Medical Certificate
                </a>
              )}
              {leave.supportDocument && (
                <a href={leave.supportDocument} target="_blank" rel="noreferrer"
                  style={{ padding: "7px 16px", background: "#f0fdf4", color: "#15803d", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  📄 Support Document
                </a>
              )}
            </div>
          </>
        )}

        {/* approval info */}
        {leave.approvedAt && (
          <>
            <div style={{ marginTop: 18, marginBottom: 6, fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>✅ Action Info</div>
            <Row label="Action At" val={fmtLong(leave.approvedAt)} />
          </>
        )}

        {/* action buttons — only for pending */}
        {leave.status === "pending" && (
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => onReject(leave)} style={{ flex: 1, padding: "11px 0", background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              ✕ Reject
            </button>
            <button onClick={() => onApprove(leave._id)} style={{ flex: 2, padding: "11px 0", background: "linear-gradient(135deg,#15803d,#16a34a)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              ✓ Approve Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agent Report Modal ───────────────────────────────────────────────────────
function AgentReportModal({ agentData, onClose }) {
  if (!agentData) return null;
  const { agent, leaves, jobs } = agentData;

  const totalJobDays = jobs?.length || 0;
  const totalLeaveDays = leaves.filter(l => l.status === "approved").reduce((s, l) => s + (l.totalDays || 0), 0);
  const pendingLeaves  = leaves.filter(l => l.status === "pending").length;
  const rejectedLeaves = leaves.filter(l => l.status === "rejected").length;

  // group leaves by type
  const byType = leaves.filter(l => l.status === "approved").reduce((acc, l) => {
    acc[l.leaveType] = (acc[l.leaveType] || 0) + (l.totalDays || 0);
    return acc;
  }, {});

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, padding: 24, margin: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{agent?.name || "Agent"} — Full Report</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{agent?.email} · {agent?.phone}</p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
        </div>

        {/* summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 }}>
          <Stat label="Jobs Done"        value={totalJobDays}   color="#6366f1" />
          <Stat label="Leave Days (App)" value={totalLeaveDays} color="#f59e0b" sub="approved only" />
          <Stat label="Pending Leaves"   value={pendingLeaves}  color="#0ea5e9" />
          <Stat label="Rejected Leaves"  value={rejectedLeaves} color="#ef4444" />
        </div>

        {/* leave by type breakdown */}
        {Object.keys(byType).length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Approved Leave Breakdown</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {Object.entries(byType).map(([type, days]) => (
                <div key={type} style={{ padding: "6px 14px", borderRadius: 20, background: LEAVE_COLORS[type] + "18", border: `1.5px solid ${LEAVE_COLORS[type]}40`, fontSize: 12, fontWeight: 700, color: LEAVE_COLORS[type] }}>
                  {LEAVE_LABELS[type] || type}: {days} day{days !== 1 ? "s" : ""}
                </div>
              ))}
            </div>
          </>
        )}

        {/* job history table */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Working Days History ({totalJobDays} Jobs)</div>
        {jobs?.length > 0 ? (
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Date", "Area", "Start KM", "Close KM", "Distance", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <tr key={job._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{i + 1}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{fmt(job.jobStartTime)}</td>
                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{job.area || job.address || "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{job.startKm ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{job.closeKm ?? "—"}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: "#6366f1" }}>{job.totalDistanceKm ?? "—"} km</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 700, background: job.jobStatus === "closed" ? "#f0fdf4" : "#fef9c3", color: job.jobStatus === "closed" ? "#15803d" : "#92400e" }}>
                        {job.jobStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>No job history found.</p>
        )}

        {/* leave history */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>All Leave Requests ({leaves.length})</div>
        {leaves.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Type", "From", "To", "Days", "Reason", "Status", "Admin Remark"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.map((l, i) => (
                  <tr key={l._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 700, background: (LEAVE_COLORS[l.leaveType] || "#64748b") + "18", color: LEAVE_COLORS[l.leaveType] || "#64748b" }}>
                        {l.leaveType}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{fmt(l.fromDate)}</td>
                    <td style={{ padding: "8px 10px" }}>{fmt(l.toDate)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700 }}>{l.totalDays}</td>
                    <td style={{ padding: "8px 10px", color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.reason}</td>
                    <td style={{ padding: "8px 10px" }}><StatusPill status={l.status} /></td>
                    <td style={{ padding: "8px 10px", color: l.status === "rejected" ? "#dc2626" : "#64748b", fontSize: 11 }}>{l.adminRemark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>No leave requests found.</p>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminLeaveManagement() {
  const [tab, setTab]       = useState("all");       // all | pending | approved | rejected
  const [leaves, setLeaves] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // modals
  const [detailLeave,   setDetailLeave]   = useState(null);
  const [rejectLeave,   setRejectLeave]   = useState(null);
  const [agentReport,   setAgentReport]   = useState(null);  // { agent, leaves, jobs }
  const [reportLoading, setReportLoading] = useState(false);

  // filters
  const [search,     setSearch]     = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");

  // ── fetch all leaves ──────────────────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/marketing-agent/leaves/admin/all`, {
        headers: adminHeaders(),
      });
      setLeaves(res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── fetch agents list ─────────────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/marketing-agent/admin/all-agents`, {
        headers: adminHeaders(),
      });
      setAgents(res.data.agents || res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchAgents();
  }, [fetchLeaves, fetchAgents]);

  // ── approve / reject ──────────────────────────────────────────────────────
  const handleAction = async (id, status, adminRemark = "") => {
    try {
      await axios.patch(
        `${API}/api/marketing-agent/leaves/admin/${id}`,
        { status, adminRemark },
        { headers: adminHeaders() }
      );
      toast.success(`Leave ${status} successfully`);
      setDetailLeave(null);
      setRejectLeave(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  // ── open per-agent full report ────────────────────────────────────────────
  const openAgentReport = async (agentObj) => {
    setReportLoading(true);
    try {
      // leaves already fetched — filter by agentId
      const agentId = agentObj._id || agentObj.agentId?._id;
      const agentLeaves = leaves.filter(l => {
        const lid = l.agentId?._id || l.agentId;
        return lid?.toString() === agentId?.toString();
      });

      // fetch profile to get jobHistory
      const res = await axios.get(`${API}/api/marketing-agent/admin/agent/${agentId}`, {
        headers: adminHeaders(),
      }).catch(() => ({ data: {} }));

      const agentProfile = res.data.agent || res.data.data || agentObj;
      const jobs = agentProfile.jobHistory || [];

      setAgentReport({ agent: agentProfile, leaves: agentLeaves, jobs });
    } catch {
      toast.error("Could not load agent report");
    } finally {
      setReportLoading(false);
    }
  };

  // ── filtered leaves ───────────────────────────────────────────────────────
  const filtered = leaves.filter(l => {
    const name = (l.name || l.agentId?.name || "").toLowerCase();
    const email = (l.agentId?.email || "").toLowerCase();
    const q = search.toLowerCase();

    const matchSearch  = !q || name.includes(q) || email.includes(q);
    const matchTab     = tab === "all" || l.status === tab;
    const matchType    = filterType === "all" || l.leaveType === filterType;
    const matchMonth   = !filterMonth || (l.fromDate && l.fromDate.startsWith(filterMonth));

    return matchSearch && matchTab && matchType && matchMonth;
  });

  // ── summary counts ────────────────────────────────────────────────────────
  const total    = leaves.length;
  const pending  = leaves.filter(l => l.status === "pending").length;
  const approved = leaves.filter(l => l.status === "approved").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;
  const totalApprovedDays = leaves.filter(l => l.status === "approved").reduce((s, l) => s + (l.totalDays || 0), 0);

  // group agents for the "Agents Report" tab
  const agentSummary = (() => {
    const map = {};
    leaves.forEach(l => {
      const id   = l.agentId?._id || l.agentId || "unknown";
      const name = l.name || l.agentId?.name || "Unknown";
      const email = l.agentId?.email || "";
      const area  = l.agentId?.assignedArea || "";
      if (!map[id]) map[id] = { id, name, email, area, total: 0, pending: 0, approved: 0, rejected: 0, approvedDays: 0, agentObj: l.agentId };
      map[id].total++;
      map[id][l.status]++;
      if (l.status === "approved") map[id].approvedDays += (l.totalDays || 0);
    });
    return Object.values(map);
  })();

  const TABS = [
    { id: "all",      label: "All Leaves",    count: total },
    { id: "pending",  label: "Pending",        count: pending },
    { id: "approved", label: "Approved",       count: approved },
    { id: "rejected", label: "Rejected",       count: rejected },
    { id: "agents",   label: "Agent Reports",  count: agentSummary.length },
  ];

  return (
    <>
      <style>{`
        .alm * { box-sizing: border-box; }
        .alm { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 0; }
        .alm-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .alm-table th { padding: 10px 12px; background: #f8fafc; text-align: left; font-weight: 700; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1.5px solid #e5e7eb; white-space: nowrap; }
        .alm-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .alm-table tr:hover td { background: #f8fafc; }
        .alm-table tr:last-child td { border-bottom: none; }
        .alm-btn { padding: 6px 13px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; font-family: inherit; transition: opacity .15s; }
        .alm-btn:hover { opacity: .85; }
        .alm-inp { padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 9px; font-size: 13px; outline: none; font-family: inherit; background: #fff; }
        .alm-inp:focus { border-color: #6366f1; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .alm-row { animation: fadeUp .25s ease both; }
      `}</style>

      <div className="alm">

        {/* ── page header ── */}
        <div style={{ background: "linear-gradient(135deg,#1e3a5f,#0f2744)", borderRadius: 16, padding: "22px 24px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#fff" }}>Leave Management</h2>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>All agents · Full history · Approve or reject with reason</p>
          </div>
          <button onClick={fetchLeaves} style={{ padding: "9px 18px", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            ↻ Refresh
          </button>
        </div>

        {/* ── summary stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 22 }}>
          <Stat label="Total Leaves"     value={total}             color="#6366f1" />
          <Stat label="Pending"          value={pending}           color="#f59e0b" sub="awaiting action" />
          <Stat label="Approved"         value={approved}          color="#22c55e" />
          <Stat label="Rejected"         value={rejected}          color="#ef4444" />
          <Stat label="Approved Days"    value={totalApprovedDays} color="#0ea5e9" sub="total days off" />
          <Stat label="Agents w/ Leaves" value={agentSummary.length} color="#8b5cf6" />
        </div>

        {/* ── tabs ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid", borderColor: tab === t.id ? "#6366f1" : "#e5e7eb", background: tab === t.id ? "#6366f1" : "#fff", color: tab === t.id ? "#fff" : "#64748b", fontWeight: 700, cursor: "pointer", fontSize: 12.5, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              {t.label}
              <span style={{ background: tab === t.id ? "rgba(255,255,255,0.25)" : "#f1f5f9", color: tab === t.id ? "#fff" : "#64748b", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── filters (not shown on agents tab) ── */}
        {tab !== "agents" && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input className="alm-inp" placeholder="Search agent name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: "1 1 200px", minWidth: 180 }} />
            <select className="alm-inp" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Leave Types</option>
              {Object.entries(LEAVE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input className="alm-inp" type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} title="Filter by month" />
            {(search || filterType !== "all" || filterMonth) && (
              <button className="alm-btn" onClick={() => { setSearch(""); setFilterType("all"); setFilterMonth(""); }}
                style={{ background: "#f1f5f9", color: "#64748b" }}>✕ Clear</button>
            )}
          </div>
        )}

        {/* ── AGENT REPORTS TAB ── */}
        {tab === "agents" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", fontSize: 13, fontWeight: 700, color: "#374151" }}>
              All Agents — Working Days & Leave Summary
            </div>
            {agentSummary.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No data yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="alm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Agent</th>
                      <th>Area</th>
                      <th>Total Leaves</th>
                      <th>Approved Days</th>
                      <th>Pending</th>
                      <th>Approved</th>
                      <th>Rejected</th>
                      <th>Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentSummary.map((a, i) => (
                      <tr key={a.id} className="alm-row" style={{ animationDelay: `${i * 30}ms` }}>
                        <td style={{ color: "#94a3b8", fontWeight: 600 }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.email}</div>
                        </td>
                        <td style={{ color: "#64748b" }}>{a.area || "—"}</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{a.total}</td>
                        <td>
                          <span style={{ fontWeight: 800, color: "#f59e0b", fontSize: 14 }}>{a.approvedDays}</span>
                          <span style={{ color: "#94a3b8", fontSize: 11 }}> days</span>
                        </td>
                        <td><span style={{ color: "#f59e0b", fontWeight: 700 }}>{a.pending}</span></td>
                        <td><span style={{ color: "#22c55e", fontWeight: 700 }}>{a.approved}</span></td>
                        <td><span style={{ color: "#ef4444", fontWeight: 700 }}>{a.rejected}</span></td>
                        <td>
                          <button className="alm-btn"
                            onClick={() => openAgentReport({ _id: a.id, name: a.name, email: a.email, assignedArea: a.area, ...a.agentObj })}
                            style={{ background: "#eff6ff", color: "#2563eb" }}>
                            {reportLoading ? "…" : "Full Report"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── LEAVES TABLE ── */}
        {tab !== "agents" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
              {tab === "pending" && pending > 0 && (
                <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>⚠ {pending} pending approval</span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: 50, textAlign: "center" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>Loading leaves…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 50, textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🌴</div>
                <p style={{ margin: 0, fontWeight: 700 }}>No leave requests found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="alm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Agent</th>
                      <th>Leave Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Applied</th>
                      <th>Status</th>
                      <th>Admin Remark</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l, i) => {
                      const agentName = l.name || l.agentId?.name || "—";
                      const agentEmail = l.agentId?.email || "";
                      return (
                        <tr key={l._id || i} className="alm-row" style={{ animationDelay: `${i * 20}ms` }}>
                          <td style={{ color: "#94a3b8", fontWeight: 600 }}>{i + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{agentName}</div>
                            {agentEmail && <div style={{ fontSize: 11, color: "#94a3b8" }}>{agentEmail}</div>}
                            {l.agentId?.assignedArea && <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>{l.agentId.assignedArea}</div>}
                          </td>
                          <td>
                            <span style={{ padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: (LEAVE_COLORS[l.leaveType] || "#64748b") + "18", color: LEAVE_COLORS[l.leaveType] || "#64748b" }}>
                              {l.leaveType}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(l.fromDate)}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{fmt(l.toDate)}</td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#6366f1" }}>
                            {l.totalDays}
                            {l.halfDay && <span style={{ fontSize: 9, color: "#8b5cf6", display: "block" }}>Half-Day</span>}
                          </td>
                          <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b", fontSize: 12 }} title={l.reason}>{l.reason || "—"}</td>
                          <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{fmt(l.createdAt)}</td>
                          <td><StatusPill status={l.status} /></td>
                          <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, color: l.status === "rejected" ? "#dc2626" : "#64748b" }} title={l.adminRemark}>
                            {l.adminRemark || "—"}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                              <button className="alm-btn" onClick={() => setDetailLeave(l)}
                                style={{ background: "#eff6ff", color: "#2563eb" }}>View</button>
                              {l.status === "pending" && (
                                <>
                                  <button className="alm-btn" onClick={() => handleAction(l._id, "approved")}
                                    style={{ background: "#f0fdf4", color: "#15803d" }}>✓</button>
                                  <button className="alm-btn" onClick={() => setRejectLeave(l)}
                                    style={{ background: "#fef2f2", color: "#dc2626" }}>✕</button>
                                </>
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

        {/* ── modals ── */}
        <DetailModal
          leave={detailLeave}
          onClose={() => setDetailLeave(null)}
          onApprove={(id) => handleAction(id, "approved")}
          onReject={(leave) => { setDetailLeave(null); setRejectLeave(leave); }}
        />
        <RejectModal
          leave={rejectLeave}
          onClose={() => setRejectLeave(null)}
          onConfirm={handleAction}
        />
        {agentReport && (
          <AgentReportModal agentData={agentReport} onClose={() => setAgentReport(null)} />
        )}
      </div>
    </>
  );
}