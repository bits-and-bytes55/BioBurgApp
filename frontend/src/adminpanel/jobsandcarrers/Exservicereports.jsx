import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

// ─── Old status stages (original tracking) ──────────────────────────────────
const STAGES = ["pending", "reviewing", "shortlisted", "rejected", "hired"];
const STAGE_COLORS = {
  pending:     { bg: "#fef9c3", color: "#854d0e", bar: "#facc15" },
  reviewing:   { bg: "#eff6ff", color: "#1d4ed8", bar: "#60a5fa" },
  shortlisted: { bg: "#f0fdf4", color: "#15803d", bar: "#4ade80" },
  rejected:    { bg: "#fff1f2", color: "#be123c", bar: "#f87171" },
  hired:       { bg: "#f5f3ff", color: "#6d28d9", bar: "#a78bfa" },
};

const ARM_BADGE = {
  Army:        { bg: "#fef9c3", color: "#854d0e" },
  Navy:        { bg: "#eff6ff", color: "#1d4ed8" },
  "Air Force": { bg: "#f5f3ff", color: "#6d28d9" },
  Any:         { bg: "#f1f5f9", color: "#475569" },
};

const useWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtMonth = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// ─── Mini bar chart (pure CSS) ────────────────────────────────────────────────
const MiniBarChart = ({ data, maxVal }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
    {data.map((d, i) => {
      const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
      return (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div
            title={`${d.label}: ${d.value}`}
            style={{
              width: "100%",
              height: `${Math.max(pct, 4)}%`,
              background: d.color,
              borderRadius: "3px 3px 0 0",
              transition: "height 0.4s ease",
              cursor: "pointer",
            }}
          />
        </div>
      );
    })}
  </div>
);

// ─── Export CSV helper ────────────────────────────────────────────────────────
const exportCSV = (rows, filename) => {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => `"${(r[k] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function ExServiceReports() {
  const [jobs, setJobs]       = useState([]);
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // drill-down job

  // ── Filters ────────────────────────────────────────────────────────────────
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [startMonth, setStartMonth] = useState(fmtMonth(sixMonthsAgo));
  const [endMonth, setEndMonth]     = useState(fmtMonth(now));
  const [statusFilter, setStatusFilter]   = useState("all");
  const [armFilter, setArmFilter]         = useState("all");
  const [searchFilter, setSearchFilter]   = useState("");
  const [view, setView] = useState("overview"); // "overview" | "jobs" | "applicants"

  const w = useWidth();
  const isMobile  = w < 640;
  const isTablet  = w < 1024;

  const token   = localStorage.getItem("adminToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [jr, ar] = await Promise.all([
        axios.get(`${BASE_API}/api/exservice-jobs`, { headers }),
        axios.get(`${BASE_API}/api/exservice-jobs/applications`, { headers }),
      ]);
      setJobs(jr.data.jobs ?? []);
      setApps(ar.data.data ?? []);
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Date-filtered apps ─────────────────────────────────────────────────────
  const dateFilteredApps = useMemo(() => {
    const start = new Date(startMonth + "-01");
    const end   = new Date(endMonth + "-01");
    end.setMonth(end.getMonth() + 1); // exclusive end
    return apps.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= start && d < end;
    });
  }, [apps, startMonth, endMonth]);

  // ── Further filtered for applicants table ──────────────────────────────────
  const filteredApps = useMemo(() => {
    return dateFilteredApps.filter((a) => {
      const matchStatus = statusFilter === "all" || (a.status || "pending") === statusFilter;
      const matchArm    = armFilter    === "all" || a.serviceArm === armFilter;
      const matchSearch = !searchFilter ||
        a.fullName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.applyingFor?.toLowerCase().includes(searchFilter.toLowerCase());
      return matchStatus && matchArm && matchSearch;
    });
  }, [dateFilteredApps, statusFilter, armFilter, searchFilter]);

  // ── Grouped by job ─────────────────────────────────────────────────────────
  const grouped = useMemo(() =>
    jobs.map((job) => {
      const jobApps = dateFilteredApps.filter(
        (a) => a.applyingFor?.toLowerCase().trim() === job.title?.toLowerCase().trim()
      );
      const counts = STAGES.reduce((acc, st) => {
        acc[st] = jobApps.filter((a) => (a.status || "pending") === st).length;
        return acc;
      }, {});
      return { job, apps: jobApps, counts, total: jobApps.length };
    }),
  [jobs, dateFilteredApps]);

  const knownTitles   = jobs.map((j) => j.title?.toLowerCase().trim());
  const uncategorized = dateFilteredApps.filter(
    (a) => !knownTitles.includes(a.applyingFor?.toLowerCase().trim())
  );

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totals = STAGES.reduce((acc, st) => {
    acc[st] = dateFilteredApps.filter((a) => (a.status || "pending") === st).length;
    return acc;
  }, {});

  // Monthly breakdown (apps per month in range)
  const monthlyData = useMemo(() => {
    const map = {};
    dateFilteredApps.forEach((a) => {
      const key = fmtMonth(new Date(a.createdAt));
      map[key] = (map[key] || 0) + 1;
    });
    // Build ordered months
    const start = new Date(startMonth + "-01");
    const end   = new Date(endMonth + "-01");
    const months = [];
    const cur = new Date(start);
    while (cur <= end) {
      const k = fmtMonth(cur);
      months.push({ key: k, label: cur.toLocaleString("en-IN", { month: "short", year: "2-digit" }), value: map[k] || 0 });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  }, [dateFilteredApps, startMonth, endMonth]);

  const maxMonthly = Math.max(...monthlyData.map((m) => m.value), 1);

  // Arm breakdown
  const armData = useMemo(() => {
    const map = {};
    dateFilteredApps.forEach((a) => {
      const arm = a.serviceArm || "Other";
      map[arm] = (map[arm] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [dateFilteredApps]);

  const uniqueArms = [...new Set(apps.map((a) => a.serviceArm).filter(Boolean))];

  // Conversion rates
  const hiringRate   = dateFilteredApps.length > 0 ? ((totals.hired || 0) / dateFilteredApps.length * 100).toFixed(1) : 0;
  const shortlistRate = dateFilteredApps.length > 0 ? ((totals.shortlisted || 0) / dateFilteredApps.length * 100).toFixed(1) : 0;
  const rejectionRate = dateFilteredApps.length > 0 ? ((totals.rejected || 0) / dateFilteredApps.length * 100).toFixed(1) : 0;

  // ── Export handlers ────────────────────────────────────────────────────────
  const exportApplicants = () => {
    exportCSV(
      filteredApps.map((a) => ({
        Name: a.fullName,
        Email: a.email,
        "Applying For": a.applyingFor,
        "Service Arm": a.serviceArm || "—",
        Rank: a.rank || "—",
        "Years of Service": a.yearsOfService || "—",
        City: a.city || "—",
        State: a.state || "—",
        Status: a.status || "pending",
        "Applied On": fmt(a.createdAt),
      })),
      `exservice-applicants-${startMonth}-to-${endMonth}.csv`
    );
  };

  const exportSummary = () => {
    exportCSV(
      [
        { Metric: "Total Applications", Value: dateFilteredApps.length },
        { Metric: "Pending",            Value: totals.pending },
        { Metric: "Reviewing",          Value: totals.reviewing },
        { Metric: "Shortlisted",        Value: totals.shortlisted },
        { Metric: "Rejected",           Value: totals.rejected },
        { Metric: "Hired",              Value: totals.hired },
        { Metric: "Hiring Rate",        Value: `${hiringRate}%` },
        { Metric: "Shortlist Rate",     Value: `${shortlistRate}%` },
        { Metric: "Rejection Rate",     Value: `${rejectionRate}%` },
        { Metric: "Report Period",      Value: `${startMonth} to ${endMonth}` },
      ],
      `exservice-summary-${startMonth}-to-${endMonth}.csv`
    );
  };

  const exportJobReport = () => {
    exportCSV(
      grouped.map(({ job, counts, total }) => ({
        "Job Title":   job.title,
        Department:    job.department || "—",
        Location:      job.location || "—",
        "Service Arm": job.serviceArm || "Any",
        "Total Apps":  total,
        Pending:       counts.pending || 0,
        Reviewing:     counts.reviewing || 0,
        Shortlisted:   counts.shortlisted || 0,
        Rejected:      counts.rejected || 0,
        Hired:         counts.hired || 0,
        "Hire Rate":   total > 0 ? `${Math.round(((counts.hired || 0) / total) * 100)}%` : "0%",
        "Posted On":   fmt(job.createdAt),
      })),
      `exservice-jobs-report-${startMonth}-to-${endMonth}.csv`
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // DRILL-DOWN: individual job applicants
  // ══════════════════════════════════════════════════════════════════════════
  if (selected) {
    const { job, apps: jApps } = selected;
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <button onClick={() => setSelected(null)} style={s.backBtn}>← Back to Reports</button>
            <p style={s.label}>Jobs & ExService Zone · Reports</p>
            <h1 style={{ ...s.title, fontSize: isMobile ? 17 : 21 }}>{job.title}</h1>
            <p style={s.sub}>{[job.serviceArm, job.department, job.location].filter(Boolean).join(" · ")}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => exportCSV(
                jApps.map((a) => ({
                  Name: a.fullName, Email: a.email,
                  "Service Arm": a.serviceArm || "—", Rank: a.rank || "—",
                  Status: a.status || "pending", "Applied On": fmt(a.createdAt),
                })),
                `${job.title}-applicants.csv`
              )}
              style={s.exportBtn}
            >
              ↓ Export CSV
            </button>
            <span style={{ fontSize: 13, color: "#64748b", alignSelf: "center" }}>
              {jApps.length} applicant{jApps.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Stage mini-stats */}
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, minWidth: isMobile ? 480 : "auto" }}>
            {STAGES.map((st) => {
              const c = STAGE_COLORS[st];
              const count = jApps.filter((a) => (a.status || "pending") === st).length;
              const pct = jApps.length > 0 ? Math.round((count / jApps.length) * 100) : 0;
              return (
                <div key={st} style={{ ...s.miniStat, borderTop: `3px solid ${c.bar}`, flex: "1 0 80px" }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: c.color, margin: 0 }}>{count}</p>
                  <p style={{ fontSize: 10, color: "#64748b", textTransform: "capitalize", marginTop: 2 }}>{st}</p>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage bar chart */}
        <div style={{ ...s.reportBox, marginBottom: 20 }}>
          <p style={s.boxTitle}>Status Distribution — {job.title}</p>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 80, padding: "0 8px" }}>
            {STAGES.map((st) => {
              const c = STAGE_COLORS[st];
              const count = jApps.filter((a) => (a.status || "pending") === st).length;
              const pct = jApps.length > 0 ? (count / jApps.length) * 100 : 0;
              return (
                <div key={st} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{count}</span>
                  <div style={{ width: "100%", height: 48, display: "flex", alignItems: "flex-end" }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(pct, 4)}%`,
                        background: c.bar,
                        borderRadius: "3px 3px 0 0",
                        transition: "height 0.4s ease",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9, color: "#94a3b8", textTransform: "capitalize" }}>{st}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applicant table */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jApps.length === 0
              ? <div style={s.empty}>No applicants for this position.</div>
              : jApps.map((a) => {
                  const st = a.status || "pending";
                  const c = STAGE_COLORS[st];
                  return (
                    <div key={a._id} style={{ ...s.mCard, borderLeft: `3px solid ${c.bar}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", margin: 0 }}>{a.fullName}</p>
                        <span style={{ ...s.chip, background: c.bg, color: c.color }}>{st}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0" }}>{a.serviceArm} · {a.rank || "—"}</p>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0" }}>{a.email}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{fmt(a.createdAt)}</p>
                    </div>
                  );
                })}
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["#", "Name", "Email", "Service Arm", "Rank", "Yrs of Service", "Applied On", "Status"].map(
                    (h) => <th key={h} style={s.th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {jApps.length === 0
                  ? <tr><td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#94a3b8", padding: 40 }}>No applicants found.</td></tr>
                  : jApps.map((a, i) => {
                      const st = a.status || "pending";
                      const c = STAGE_COLORS[st];
                      return (
                        <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                          <td style={s.td}>{i + 1}</td>
                          <td style={s.td}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>{a.fullName}</p>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{a.city}, {a.state}</p>
                          </td>
                          <td style={s.td}>{a.email}</td>
                          <td style={s.td}>{a.serviceArm || "—"}</td>
                          <td style={s.td}>{a.rank || "—"}</td>
                          <td style={s.td}>{a.yearsOfService || "—"}</td>
                          <td style={s.td}><span style={{ fontSize: 13, color: "#64748b" }}>{fmt(a.createdAt)}</span></td>
                          <td style={s.td}><span style={{ ...s.chip, background: c.bg, color: c.color }}>{st}</span></td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN REPORTS VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={s.page}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <p style={s.label}>Jobs & ExService Zone</p>
          <h1 style={{ ...s.title, fontSize: isMobile ? 18 : 24 }}>Ex-Service Recruitment Reports</h1>
          <p style={s.sub}>
            Detailed analytics & applicant records · {startMonth} to {endMonth}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={fetchAll} style={s.refreshBtn}>↺ Refresh</button>
          <button onClick={exportSummary} style={s.exportBtn}>↓ Summary CSV</button>
          <button onClick={exportJobReport} style={s.exportBtn}>↓ Jobs CSV</button>
          <button onClick={exportApplicants} style={s.exportBtn}>↓ Applicants CSV</button>
        </div>
      </div>

      {/* ── Date & Filters ──────────────────────────────────────────────── */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 22,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Period:</span>
          <input
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            style={s.monthInput}
          />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>to</span>
          <input
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            style={s.monthInput}
          />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={s.selectInput}
          >
            <option value="all">All</option>
            {STAGES.map((st) => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Arm:</span>
          <select
            value={armFilter}
            onChange={(e) => setArmFilter(e.target.value)}
            style={s.selectInput}
          >
            <option value="all">All</option>
            {uniqueArms.map((arm) => <option key={arm} value={arm}>{arm}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <input
            type="text"
            placeholder="Search applicant / role..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ ...s.inputField, width: "100%", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* ── View Tabs ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: "2px solid #e2e8f0" }}>
        {[
          { key: "overview",   label: "📊 Overview"   },
          { key: "jobs",       label: "💼 By Position" },
          { key: "applicants", label: "👤 All Applicants" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={{
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: view === tab.key ? 700 : 400,
              color: view === tab.key ? "#0077a3" : "#64748b",
              background: "none",
              border: "none",
              borderBottom: view === tab.key ? "2px solid #0077a3" : "2px solid transparent",
              marginBottom: -2,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.empty}>Loading report data...</div>
      ) : (
        <>
          {/* ════════════ OVERVIEW TAB ════════════ */}
          {view === "overview" && (
            <>
              {/* KPI Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(3,1fr)" : "repeat(6,1fr)",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                {[
                  { label: "Total Applications", val: dateFilteredApps.length, accent: "#0077a3" },
                  { label: "Pending",    val: totals.pending,     accent: "#d97706" },
                  { label: "Reviewing",  val: totals.reviewing,   accent: "#2563eb" },
                  { label: "Shortlisted",val: totals.shortlisted, accent: "#15803d" },
                  { label: "Rejected",   val: totals.rejected,    accent: "#be123c" },
                  { label: "Hired",      val: totals.hired,       accent: "#6d28d9" },
                ].map((c) => (
                  <div key={c.label} style={s.statCard}>
                    <p style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: c.accent, margin: "0 0 4px" }}>
                      {c.val}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.3 }}>{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Rates */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                {[
                  { label: "Hiring Rate",     val: `${hiringRate}%`,    desc: "of applicants were hired",       color: "#6d28d9", bg: "#f5f3ff" },
                  { label: "Shortlist Rate",  val: `${shortlistRate}%`, desc: "made it to shortlist",           color: "#15803d", bg: "#f0fdf4" },
                  { label: "Rejection Rate",  val: `${rejectionRate}%`, desc: "of applications were rejected",  color: "#be123c", bg: "#fff1f2" },
                ].map((r) => (
                  <div key={r.label} style={{ ...s.reportBox, background: r.bg, borderColor: "transparent" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {r.label}
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: r.color, margin: "0 0 4px" }}>{r.val}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{r.desc}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 16,
                  marginBottom: 22,
                }}
              >
                {/* Monthly applications */}
                <div style={s.reportBox}>
                  <p style={s.boxTitle}>Applications per Month</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "0 4px", marginBottom: 8 }}>
                    {monthlyData.map((m) => {
                      const pct = maxMonthly > 0 ? (m.value / maxMonthly) * 100 : 0;
                      return (
                        <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#0077a3" }}>{m.value || ""}</span>
                          <div style={{ width: "100%", height: 56, display: "flex", alignItems: "flex-end" }}>
                            <div
                              style={{
                                width: "100%",
                                height: `${Math.max(pct, 3)}%`,
                                background: "linear-gradient(to top, #0077a3, #38bdf8)",
                                borderRadius: "3px 3px 0 0",
                                transition: "height 0.4s ease",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" }}>{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status breakdown */}
                <div style={s.reportBox}>
                  <p style={s.boxTitle}>Status Breakdown</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {STAGES.map((st) => {
                      const c = STAGE_COLORS[st];
                      const count = totals[st] || 0;
                      const pct  = dateFilteredApps.length > 0 ? Math.round((count / dateFilteredApps.length) * 100) : 0;
                      return (
                        <div key={st}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 12, color: "#334155", textTransform: "capitalize", fontWeight: 500 }}>{st}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{count} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct}%)</span></span>
                          </div>
                          <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: c.bar, borderRadius: 4, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Service arm breakdown */}
                <div style={s.reportBox}>
                  <p style={s.boxTitle}>Applications by Service Arm</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {armData.length === 0
                      ? <span style={{ fontSize: 13, color: "#94a3b8" }}>No data</span>
                      : armData.map(({ label, value }) => {
                          const ab = ARM_BADGE[label] || ARM_BADGE.Any;
                          const pct = dateFilteredApps.length > 0 ? Math.round((value / dateFilteredApps.length) * 100) : 0;
                          return (
                            <div key={label}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ ...s.chip, background: ab.bg, color: ab.color }}>{label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{value} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct}%)</span></span>
                              </div>
                              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: ab.color, borderRadius: 4, opacity: 0.5, transition: "width 0.5s ease" }} />
                              </div>
                            </div>
                          );
                        })}
                  </div>
                </div>

                {/* Top positions */}
                <div style={s.reportBox}>
                  <p style={s.boxTitle}>Top Positions by Applications</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {grouped
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 6)
                      .map(({ job, total: t }) => {
                        const maxT = Math.max(...grouped.map((g) => g.total), 1);
                        const pct  = Math.round((t / maxT) * 100);
                        return (
                          <div key={job._id}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 12, color: "#334155", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{job.title}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#0077a3" }}>{t}</span>
                            </div>
                            <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: "#38bdf8", borderRadius: 4, transition: "width 0.5s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════════════ JOBS TAB ════════════ */}
          {view === "jobs" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(auto-fill,minmax(370px,1fr))",
                  gap: 16,
                }}
              >
                {grouped.length === 0 ? (
                  <div style={s.empty}>No job postings found.</div>
                ) : (
                  grouped.map(({ job, apps: jApps, counts, total }) => {
                    const arm = job.serviceArm || "Any";
                    const ab  = ARM_BADGE[arm] || ARM_BADGE.Any;
                    return (
                      <div key={job._id} style={s.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 6 }}>
                              <span style={{ ...s.chip, background: ab.bg, color: ab.color }}>{arm}</span>
                              {job.minRank && <span style={{ ...s.chip, background: "#f8fafc", color: "#475569" }}>{job.minRank}+</span>}
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 3px" }}>{job.title}</h3>
                            <p style={{ fontSize: 12, color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {[job.department, job.location, job.jobType].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>{total}</p>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>applicant{total !== 1 ? "s" : ""}</p>
                          </div>
                        </div>

                        {/* Stage bars */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                          {STAGES.map((st) => {
                            const count = counts[st] || 0;
                            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                            const c     = STAGE_COLORS[st];
                            return (
                              <div key={st}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{st}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{count}</span>
                                </div>
                                <div style={{ height: 5, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: c.bar, borderRadius: 4, transition: "width 0.5s ease" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Meta */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                          {STAGES.map((st) => {
                            const count = counts[st] || 0;
                            if (!count) return null;
                            const c = STAGE_COLORS[st];
                            return <span key={st} style={{ ...s.chip, background: c.bg, color: c.color }}>{count} {st}</span>;
                          })}
                          {total === 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>No applications yet</span>}
                        </div>

                        {total > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                            {[
                              `Shortlist: ${Math.round(((counts.shortlisted || 0) / total) * 100)}%`,
                              `Hire: ${Math.round(((counts.hired || 0) / total) * 100)}%`,
                              `Posted: ${fmt(job.createdAt)}`,
                            ].map((t, i) => (
                              <span key={i} style={{ fontSize: 11, color: "#64748b", background: "#f8fafc", padding: "3px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}>{t}</span>
                            ))}
                          </div>
                        )}

                        <button onClick={() => setSelected({ job, apps: jApps })} style={s.viewBtn}>
                          View {total} Candidate{total !== 1 ? "s" : ""} →
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Walk-in / Other */}
              {uncategorized.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Walk-in / Other ({uncategorized.length})
                  </p>
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>{["Name", "Applying For", "Service Arm", "Email", "Applied On", "Status"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {uncategorized.map((a, i) => {
                          const st = a.status || "pending";
                          const c  = STAGE_COLORS[st];
                          return (
                            <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                              <td style={s.td}><p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>{a.fullName}</p></td>
                              <td style={s.td}><span style={{ fontSize: 12, background: "#eff8fb", color: "#0077a3", padding: "3px 10px", borderRadius: 20, border: "1px solid #bae6fd" }}>{a.applyingFor}</span></td>
                              <td style={s.td}>{a.serviceArm || "—"}</td>
                              <td style={s.td}>{a.email}</td>
                              <td style={s.td}><span style={{ fontSize: 13, color: "#64748b" }}>{fmt(a.createdAt)}</span></td>
                              <td style={s.td}><span style={{ ...s.chip, background: c.bg, color: c.color }}>{st}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════ APPLICANTS TAB ════════════ */}
          {view === "applicants" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  Showing <strong>{filteredApps.length}</strong> of {dateFilteredApps.length} applicants
                </span>
                <button onClick={exportApplicants} style={s.exportBtn}>↓ Export Filtered CSV</button>
              </div>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["#", "Name", "Email", "Applying For", "Service Arm", "Rank", "Yrs", "Applied On", "Status"].map(
                        (h) => <th key={h} style={s.th}>{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.length === 0
                      ? <tr><td colSpan={9} style={{ ...s.td, textAlign: "center", color: "#94a3b8", padding: 40 }}>No applicants match the selected filters.</td></tr>
                      : filteredApps.map((a, i) => {
                          const st = a.status || "pending";
                          const c  = STAGE_COLORS[st];
                          return (
                            <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                              <td style={s.td}>{i + 1}</td>
                              <td style={s.td}>
                                <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>{a.fullName}</p>
                                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{a.city}, {a.state}</p>
                              </td>
                              <td style={s.td}><span style={{ fontSize: 13 }}>{a.email}</span></td>
                              <td style={s.td}><span style={{ fontSize: 12, background: "#eff8fb", color: "#0077a3", padding: "3px 8px", borderRadius: 20, border: "1px solid #bae6fd" }}>{a.applyingFor}</span></td>
                              <td style={s.td}>{a.serviceArm || "—"}</td>
                              <td style={s.td}>{a.rank || "—"}</td>
                              <td style={s.td}>{a.yearsOfService || "—"}</td>
                              <td style={s.td}><span style={{ fontSize: 13, color: "#64748b" }}>{fmt(a.createdAt)}</span></td>
                              <td style={s.td}><span style={{ ...s.chip, background: c.bg, color: c.color }}>{st}</span></td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page:       { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 0 },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 12, flexWrap: "wrap" },
  label:      { fontSize: 12, fontWeight: 600, color: "#0077a3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 },
  title:      { fontWeight: 700, color: "#0f172a" },
  sub:        { fontSize: 13, color: "#64748b", marginTop: 4 },
  refreshBtn: { padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#374151", backgroundColor: "#fff", cursor: "pointer" },
  exportBtn:  { padding: "8px 14px", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#0077a3", backgroundColor: "#f0f9ff", cursor: "pointer" },
  backBtn:    { background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "#0077a3", cursor: "pointer", padding: 0, marginBottom: 8, display: "block" },
  statCard:   { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", textAlign: "center" },
  card:       { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column" },
  reportBox:  { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px" },
  boxTitle:   { fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" },
  chip:       { fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, textTransform: "capitalize", whiteSpace: "nowrap" },
  viewBtn:    { padding: "9px 14px", background: "#f0f9ff", color: "#0077a3", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center", marginTop: "auto" },
  tableWrap:  { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse", minWidth: 550 },
  th:         { padding: "11px 14px", fontSize: 11, fontWeight: 600, color: "#64748b", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  tr:         { borderBottom: "1px solid #f1f5f9" },
  td:         { padding: "11px 14px", verticalAlign: "middle" },
  miniStat:   { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 10px", textAlign: "center" },
  mCard:      { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 },
  empty:      { textAlign: "center", padding: "48px 20px", color: "#94a3b8", fontSize: 14 },
  monthInput: { padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, color: "#374151", outline: "none" },
  selectInput:{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, color: "#374151", outline: "none", background: "#fff" },
  inputField: { padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", outline: "none" },
};