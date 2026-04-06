import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const STATUS_COLORS = {
  pending:    { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  reviewing:  { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
  shortlisted:{ bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  rejected:   { bg: "#fff1f2", color: "#be123c", border: "#fda4af" },
  hired:      { bg: "#f5f3ff", color: "#6d28d9", border: "#c4b5fd" },
};

const JOB_TYPE_COLORS = {
  "Full-Time":  { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "Part-Time":  { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Internship": { bg: "#fef9c3", color: "#a16207", border: "#fef08a" },
  "Contract":   { bg: "#f3e8ff", color: "#7c3aed", border: "#e9d5ff" },
  "Consultant": { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  "Freelance":  { bg: "#f0fdf4", color: "#065f46", border: "#6ee7b7" },
};

const TABS = ["All", "Pending", "Reviewing", "Shortlisted", "Rejected", "Hired"];

export default function JobsCareersAdmin() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_API}/api/jobs-careers/applications`, { headers });
      if (res.data.success) setApplications(res.data.data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const stats = {
    total:       applications.length,
    pending:     applications.filter(a => a.status === "pending").length,
    reviewing:   applications.filter(a => a.status === "reviewing").length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    rejected:    applications.filter(a => a.status === "rejected").length,
    hired:       applications.filter(a => a.status === "hired").length,
  };

  const filtered = applications.filter(a => {
    const matchTab = activeTab === "All" || a.status === activeTab.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.applyingFor?.toLowerCase().includes(q) ||
      a.jobType?.toLowerCase().includes(q) ||
      a.phone?.includes(q);
    return matchTab && matchSearch;
  });

  const updateStatus = async (id, status) => {
    try {
      setStatusLoading(true);
      await axios.put(`${BASE_API}/api/jobs-careers/applications/${id}/status`,
        { status, adminNote }, { headers }
      );
      toast.success(`Status updated to ${status}`);
      setSelected(prev => prev ? { ...prev, status, adminNote } : null);
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status, adminNote } : a));
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const deleteApplication = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await axios.delete(`${BASE_API}/api/jobs-careers/applications/${id}`, { headers });
      toast.success("Application deleted");
      setSelected(null);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const Badge = ({ status }) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: "capitalize" }}>
        {status}
      </span>
    );
  };

  const JobTypeBadge = ({ type }) => {
    if (!type) return <span style={{ fontSize: 13, color: "#94a3b8" }}>—</span>;
    const c = JOB_TYPE_COLORS[type] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
    return (
      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
        {type}
      </span>
    );
  };

  const DetailModal = ({ app, onClose }) => {
    const [note, setNote] = useState(app.adminNote || "");
    const Row = ({ label, value }) => !value ? null : (
      <tr>
        <td style={ms.tdKey}>{label}</td>
        <td style={ms.tdVal}>{value}</td>
      </tr>
    );
    return (
      <div style={ms.overlay} onClick={onClose}>
        <div style={ms.modal} onClick={e => e.stopPropagation()}>
          <div style={ms.mHeader}>
            <div>
              <p style={ms.mSub}>Application Detail</p>
              <h2 style={ms.mTitle}>{app.fullName}</h2>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                <Badge status={app.status || "pending"} />
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  Applied for: <strong>{app.applyingFor}</strong>
                </span>
                {app.jobType && <JobTypeBadge type={app.jobType} />}
              </div>
            </div>
            <button onClick={onClose} style={ms.closeBtn}>✕</button>
          </div>
          <div style={ms.mBody}>
            {[
              { heading: "Personal Information", rows: [
                ["Full Name", app.fullName], ["Email", app.email],
                ["Phone", app.phone], ["Date of Birth", fmt(app.dateOfBirth)],
                ["Gender", app.gender], ["Applied On", fmt(app.createdAt)],
              ]},
              { heading: "Address", rows: [
                ["Address", app.address], ["City", app.city],
                ["State", app.state], ["PIN Code", app.pinCode],
              ]},
              { heading: "Professional Details", rows: [
                ["Applying For", app.applyingFor],
                ["Job Type", app.jobType],
                ["Qualification", app.qualification],
                ["Field of Study", app.fieldOfStudy],
                ["Experience", app.workExperience],
                ["Current Job Title", app.currentJobTitle],
                ["Expected Salary", app.expectedSalary],
                ["Notice Period", app.noticePeriod],
                ["Preferred Location", app.preferredLocation],
                ["LinkedIn", app.linkedIn],
                ["Skills", app.skills],
              ]},
            ].map(sec => (
              <div key={sec.heading} style={ms.section}>
                <p style={ms.secHeading}>{sec.heading}</p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>{sec.rows.map(([l, v]) => <Row key={l} label={l} value={v} />)}</tbody>
                </table>
              </div>
            ))}
            {app.coverLetter && (
              <div style={ms.section}>
                <p style={ms.secHeading}>Cover Letter</p>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{app.coverLetter}</p>
              </div>
            )}
            {app.resumeUrl && (
              <div style={ms.section}>
                <p style={ms.secHeading}>Resume</p>
                <a href={`${BASE_API}/${app.resumeUrl}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 14, color: "#0077a3", fontWeight: 500 }}>
                  View / Download Resume
                </a>
              </div>
            )}
            <div style={ms.section}>
              <p style={ms.secHeading}>Admin Note</p>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Add internal notes..." style={ms.textarea} />
            </div>
            <div style={ms.section}>
              <p style={ms.secHeading}>Update Status</p>
              <div style={ms.actionRow}>
                {["reviewing","shortlisted","rejected","hired"].map(st => (
                  <button key={st} disabled={statusLoading || app.status === st}
                    onClick={() => { setAdminNote(note); updateStatus(app._id, st); }}
                    style={{ ...ms.actionBtn, backgroundColor: STATUS_COLORS[st]?.bg, color: STATUS_COLORS[st]?.color, border: `1px solid ${STATUS_COLORS[st]?.border}`, opacity: app.status === st ? 0.5 : 1 }}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #fee2e2" }}>
              <button onClick={() => deleteApplication(app._id)} style={ms.deleteBtn}>Delete Application</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <p style={s.pageLabel}>Jobs & Careers Zone</p>
          <h1 style={s.pageTitle}>Applications Management</h1>
        </div>
        <button onClick={fetchApplications} style={s.refreshBtn}>Refresh</button>
      </div>

      {/* Stats */}
      <div style={s.statsGrid}>
        {[
          { label: "Total Applications", value: stats.total,       accent: "#0077a3" },
          { label: "Pending Review",      value: stats.pending,     accent: "#d97706" },
          { label: "Under Review",        value: stats.reviewing,   accent: "#2563eb" },
          { label: "Shortlisted",         value: stats.shortlisted, accent: "#15803d" },
          { label: "Rejected",            value: stats.rejected,    accent: "#be123c" },
          { label: "Hired",               value: stats.hired,       accent: "#6d28d9" },
        ].map(c => (
          <div key={c.label} style={s.statCard}>
            <p style={{ ...s.statNum, color: c.accent }}>{c.value}</p>
            <p style={s.statLabel}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filtersRow}>
        <div style={s.tabsWrap}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}>
              {t}
              <span style={{ ...s.tabBadge, ...(activeTab === t ? s.tabBadgeActive : {}) }}>
                {t === "All" ? stats.total : stats[t.toLowerCase()] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search by name, email, role, job type..."
          value={search} onChange={e => setSearch(e.target.value)} style={s.searchInput} />
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.emptyState}>Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyState}>No applications found.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {["#","Applicant","Contact","Applying For","Job Type","Experience","Qualification","Applied On","Status","Action"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <tr key={app._id} style={{ ...s.tr, ...(i % 2 === 0 ? {} : { backgroundColor: "#f8fafc" }) }}>
                  <td style={s.td}>{i + 1}</td>
                  <td style={s.td}>
                    <p style={{ fontWeight: 600, color: "#0f172a", fontSize: 14, marginBottom: 2 }}>{app.fullName}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{app.city}, {app.state}</p>
                  </td>
                  <td style={s.td}>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{app.email}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{app.phone}</p>
                  </td>
                  <td style={s.td}><span style={s.roleChip}>{app.applyingFor}</span></td>
                  <td style={s.td}><JobTypeBadge type={app.jobType} /></td>
                  <td style={{ ...s.td, fontSize: 13 }}>{app.workExperience || "—"}</td>
                  <td style={{ ...s.td, fontSize: 13 }}>{app.qualification || "—"}</td>
                  <td style={{ ...s.td, fontSize: 13, color: "#64748b" }}>{fmt(app.createdAt)}</td>
                  <td style={s.td}><Badge status={app.status || "pending"} /></td>
                  <td style={s.td}>
                    <button onClick={() => setSelected(app)} style={s.viewBtn}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p style={s.countText}>Showing {filtered.length} of {applications.length} applications</p>

      {selected && <DetailModal app={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const s = {
  page: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 0 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageLabel: { fontSize: 12, fontWeight: 600, color: "#0077a3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 },
  refreshBtn: { padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#374151", backgroundColor: "#fff", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 16, marginBottom: 28 },
  statCard: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "18px 20px", textAlign: "center" },
  statNum: { fontSize: 28, fontWeight: 700, margin: "0 0 4px" },
  statLabel: { fontSize: 12, color: "#64748b", margin: 0, fontWeight: 500 },
  filtersRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" },
  tabsWrap: { display: "flex", gap: 4, flexWrap: "wrap" },
  tab: { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#64748b", backgroundColor: "#fff", cursor: "pointer" },
  tabActive: { backgroundColor: "#0077a3", color: "#fff", borderColor: "#0077a3" },
  tabBadge: { backgroundColor: "#f1f5f9", color: "#64748b", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 600 },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" },
  searchInput: { padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none", minWidth: 240 },
  tableWrap: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1000 },
  th: { padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#64748b", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", verticalAlign: "middle" },
  roleChip: { fontSize: 12, fontWeight: 500, backgroundColor: "#eff8fb", color: "#0077a3", padding: "3px 10px", borderRadius: 20, border: "1px solid #bae6fd", whiteSpace: "nowrap" },
  viewBtn: { padding: "5px 14px", backgroundColor: "#0077a3", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  countText: { fontSize: 13, color: "#94a3b8", textAlign: "right", marginTop: 12 },
  emptyState: { textAlign: "center", padding: "48px 20px", color: "#94a3b8", fontSize: 14 },
};

const ms = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "40px 16px", overflowY: "auto" },
  modal: { backgroundColor: "#fff", borderRadius: 12, width: "100%", maxWidth: 700, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", fontFamily: "'Inter','Segoe UI',sans-serif" },
  mHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 28px", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, backgroundColor: "#fff", borderRadius: "12px 12px 0 0", zIndex: 1 },
  mSub: { fontSize: 11, fontWeight: 600, color: "#0077a3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 },
  mTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", padding: 4, lineHeight: 1 },
  mBody: { padding: "24px 28px" },
  section: { marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f1f5f9" },
  secHeading: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 },
  tdKey: { padding: "7px 0", fontSize: 13, color: "#64748b", fontWeight: 500, width: "38%", verticalAlign: "top" },
  tdVal: { padding: "7px 0", fontSize: 13, color: "#1e293b", verticalAlign: "top", whiteSpace: "pre-wrap" },
  textarea: { width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#374151", resize: "vertical", outline: "none", boxSizing: "border-box" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionBtn: { padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  deleteBtn: { padding: "8px 18px", backgroundColor: "#fff1f2", color: "#be123c", border: "1px solid #fda4af", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
};