import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  Users, Activity, MapPin, Target, BarChart2, TrendingUp,
  Download, RefreshCw, Search, ChevronDown, Loader2,
  AlertCircle, ArrowUp, ArrowDown, Minus, Calendar,
  Star, Award, Clock, Eye, Filter
} from "lucide-react";

const API_BASE = "/api/agent";
const TOKEN_KEY = "agentToken";
const getToken = () => localStorage.getItem(TOKEN_KEY);

const apiFetch = async (path) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const COLORS = {
  blue: "#1d4ed8", sky: "#0ea5e9", indigo: "#6366f1",
  violet: "#8b5cf6", amber: "#f59e0b", emerald: "#10b981",
  rose: "#f43f5e", slate: "#64748b", teal: "#14b8a6",
};
const MR_PALETTE = ["#1d4ed8", "#0ea5e9", "#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e", "#14b8a6", "#f97316", "#ec4899"];

/* ── Small Helpers ── */
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: COLORS.blue }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const ErrorBox = ({ msg }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
    color: "#dc2626", fontSize: 13
  }}>
    <AlertCircle size={16} /> {msg}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "18", color }}>{label}</span>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.1)" }}>
      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)} style={{
        padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
        background: active === t.key ? COLORS.blue : "#f1f5f9",
        color: active === t.key ? "white" : "#64748b", transition: "all .18s",
      }}>{t.label}</button>
    ))}
  </div>
);

const SectionCard = ({ title, subtitle, children, action }) => (
  <div style={{ background: "white", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", border: "1px solid #f1f5f9" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div style={{
    background: "white", borderRadius: 14, padding: "18px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,.07)", border: "1px solid #f1f5f9",
    display: "flex", flexDirection: "column", gap: 8, minWidth: 0,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ background: color + "18", borderRadius: 8, padding: "5px 7px", display: "flex" }}>
        <Icon size={15} style={{ color }} />
      </span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value ?? "—"}</div>
    {sub && <div style={{ fontSize: 12, color: "#64748b" }}>{sub}</div>}
  </div>
);

/* ── MR Card shown in grid ── */
const MRCard = ({ mr, index, isSelected, onSelect }) => {
  const color = MR_PALETTE[index % MR_PALETTE.length];
  const rate = mr.completionRate ?? 0;
  return (
    <div
      onClick={() => onSelect(mr)}
      style={{
        background: isSelected ? color + "10" : "white",
        borderRadius: 14, padding: "16px 18px",
        border: isSelected ? `2px solid ${color}` : "1px solid #f1f5f9",
        boxShadow: isSelected ? `0 4px 20px ${color}25` : "0 1px 4px rgba(0,0,0,.06)",
        cursor: "pointer", transition: "all .2s", minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", background: color + "20",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 800, color, flexShrink: 0
        }}>
          {(mr.name || "MR").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {mr.name || "Unknown MR"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{mr.zone || mr.area || "—"}</div>
        </div>
        {index < 3 && (
          <span style={{ marginLeft: "auto", fontSize: 16 }}>
            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Jobs", value: mr.jobs ?? 0 },
          { label: "Orders", value: mr.orders ?? 0 },
          { label: "Responses", value: mr.responses ?? 0 },
          { label: "Dist (km)", value: mr.distanceKm ?? 0 },
        ].map(item => (
          <div key={item.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>{item.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>Completion Rate</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{rate}%</span>
        </div>
        <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(rate, 100)}%`, background: color, borderRadius: 99, transition: "width .6s ease" }} />
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ── */
export default function MrChartPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("thisMonth");
  const [selectedMR, setSelectedMR] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("jobs");
  const [chartType, setChartType] = useState("comparison");

  // Date range
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [appliedFrom, setAppliedFrom] = useState(firstOfMonth);
  const [appliedTo, setAppliedTo] = useState(today);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let url = "/work-performance";
      if (period === "custom") {
        url += `?from=${appliedFrom}&to=${appliedTo}`;
      } else {
        url += `?period=${period}`;
      }
      const res = await apiFetch(url);
      setData(res);
      if (!selectedMR && res?.mrs?.length > 0) setSelectedMR(res.mrs[0]);
    } catch (e) {
      setError(e.message || "Failed to load MR performance data");
    } finally {
      setLoading(false);
    }
  }, [period, appliedFrom, appliedTo]);

  useEffect(() => { load(); }, [load]);

  const mrs = data?.mrs || [];
  const overview = data?.overview || {};

  const filteredMRs = mrs
    .filter(mr => mr.name?.toLowerCase().includes(search.toLowerCase()) || mr.area?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));

  // Comparison bar chart data
  const comparisonData = filteredMRs.slice(0, 10).map(mr => ({
    name: (mr.name || "MR").split(" ")[0],
    Jobs: mr.jobs ?? 0,
    Orders: mr.orders ?? 0,
    Responses: mr.responses ?? 0,
  }));

  // Trend data for selected MR
  const trendData = selectedMR?.dailyBreakdown || [];

  // Radar for selected MR
  const radarData = selectedMR ? [
    { metric: "Jobs", value: selectedMR.jobs ?? 0 },
    { metric: "Responses", value: selectedMR.responses ?? 0 },
    { metric: "Orders", value: selectedMR.orders ?? 0 },
    { metric: "Samples", value: selectedMR.samplesGiven ?? 0 },
    { metric: "Doctors", value: selectedMR.doctorsCovered ?? 0 },
    { metric: "Distance", value: selectedMR.distanceKm ?? 0 },
  ] : [];

  const exportCSV = () => {
    const rows = [
      ["Name", "Area", "Jobs", "Completed", "Orders", "Responses", "Distance(km)", "Completion%"],
      ...filteredMRs.map(mr => [mr.name, mr.area, mr.jobs, mr.completed, mr.orders, mr.responses, mr.distanceKm, mr.completionRate])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `mr-performance-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const css = `
    * { box-sizing: border-box; }
    body { margin:0; font-family: 'DM Sans', system-ui, sans-serif; background:#f8fafc; }
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .grid32 { display:grid; grid-template-columns:1.5fr 1fr; gap:14px; }
    .mr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
    @media(max-width:900px){
      .grid4{grid-template-columns:repeat(2,1fr)!important;}
      .grid32{grid-template-columns:1fr!important;}
      .grid3{grid-template-columns:1fr 1fr!important;}
    }
    @media(max-width:560px){
      .grid4{grid-template-columns:1fr!important;}
      .grid3{grid-template-columns:1fr!important;}
      .grid2{grid-template-columns:1fr!important;}
      .mr-grid{grid-template-columns:1fr!important;}
    }
    .scroll-table { overflow-x:auto; }
    .data-table { width:100%; border-collapse:collapse; font-size:13px; }
    .data-table th { padding:9px 12px; text-align:left; font-size:11px; font-weight:700;
      color:#94a3b8; text-transform:uppercase; letter-spacing:.05em;
      border-bottom:1px solid #f1f5f9; background:#fafbfc; }
    .data-table td { padding:10px 12px; color:#374151; border-bottom:1px solid #f8fafc; vertical-align:middle; }
    .data-table tr:hover td { background:#f8fafc; }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:9px;
      border:none; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; }
    .btn-ghost { background:#f1f5f9; color:#475569; }
    .btn-ghost:hover { background:#e2e8f0; }
    select { padding:7px 10px; border-radius:8px; border:1px solid #e2e8f0;
      font-size:12px; color:#374151; background:white; outline:none; cursor:pointer; }
    .progress-bar { height:6px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:99px; transition:width .6s ease; }
    input[type="date"]::-webkit-calendar-picker-indicator { opacity:0.6; cursor:pointer; }
    input[type="search"]::-webkit-search-cancel-button { cursor:pointer; }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ padding: "20px 20px 40px", maxWidth: 1280, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Reports & Analytics</span>
              <span style={{ color: "#cbd5e1" }}>/</span>
              <span style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700 }}>MR Performance Chart</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>MR Performance Chart</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              Individual Marketing Representative performance analytics
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
            </button>
            <button className="btn btn-ghost" onClick={exportCSV}><Download size={13} /> Export CSV</button>
          </div>
        </div>

        {/* PERIOD TABS */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <TabBar
            tabs={[
              { key: "today", label: "Today" },
              { key: "thisWeek", label: "This Week" },
              { key: "thisMonth", label: "This Month" },
              { key: "custom", label: "Custom Range" },
            ]}
            active={period}
            onChange={setPeriod}
          />
          {data && (
            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
              <Clock size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Live data · {mrs.length} MRs
            </span>
          )}
        </div>

        {/* DATE RANGE PICKER */}
        {period === "custom" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
              padding: "8px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", width: "fit-content"
            }}>
              <Calendar size={14} style={{ color: COLORS.blue, flexShrink: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>FROM</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 9px", fontSize: 12, color: "#374151", outline: "none", background: "#f8fafc" }} />
              </div>
              <span style={{ color: "#cbd5e1" }}>→</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>TO</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 9px", fontSize: 12, color: "#374151", outline: "none", background: "#f8fafc" }} />
              </div>
              <button
                onClick={() => { setAppliedFrom(fromDate); setAppliedTo(toDate); }}
                style={{ background: COLORS.blue, color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >Apply</button>
            </div>
          </div>
        )}

        {loading && <Spinner />}
        {error && <ErrorBox msg={error} />}

        {!loading && !error && data && (
          <>
            {/* OVERVIEW KPI */}
            <div className="grid4" style={{ marginBottom: 16 }}>
              <StatCard label="Total MRs" value={overview.totalMRs ?? mrs.length}
                sub="Active field agents" icon={Users} color={COLORS.blue} />
              <StatCard label="Total Jobs" value={overview.totalJobs ?? 0}
                sub={`${overview.completedJobs ?? 0} completed`} icon={Activity} color={COLORS.emerald} />
              <StatCard label="Total Orders" value={overview.totalOrders ?? 0}
                sub="Across all MRs" icon={BarChart2} color={COLORS.amber} />
              <StatCard label="Avg Completion" value={`${overview.avgCompletionRate ?? 0}%`}
                sub="Team average" icon={Target}
                color={(overview.avgCompletionRate ?? 0) >= 70 ? COLORS.emerald : COLORS.amber} />
            </div>

            {/* SEARCH + SORT */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "white", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "8px 12px", flex: 1, minWidth: 200, maxWidth: 320
              }}>
                <Search size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                <input
                  type="search"
                  placeholder="Search MR name or area..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ border: "none", outline: "none", fontSize: 13, color: "#374151", width: "100%", background: "transparent" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Filter size={13} style={{ color: "#94a3b8" }} />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="jobs">Sort: Jobs</option>
                  <option value="orders">Sort: Orders</option>
                  <option value="responses">Sort: Responses</option>
                  <option value="distanceKm">Sort: Distance</option>
                  <option value="completionRate">Sort: Completion %</option>
                </select>
              </div>
              <TabBar
                tabs={[
                  { key: "comparison", label: "Comparison" },
                  { key: "cards", label: "Cards" },
                  { key: "table", label: "Table" },
                ]}
                active={chartType}
                onChange={setChartType}
              />
            </div>

            {/* COMPARISON BAR CHART */}
            {chartType === "comparison" && (
              <div style={{ marginBottom: 16 }}>
                <SectionCard
                  title="MR Comparison — Jobs vs Orders vs Responses"
                  subtitle={`Top ${Math.min(filteredMRs.length, 10)} MRs by ${sortBy}`}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData} margin={{ top: 5, right: 10, bottom: 20, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="Jobs" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Orders" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Responses" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              </div>
            )}

            {/* MR CARDS GRID */}
            {chartType === "cards" && (
              <div style={{ marginBottom: 16 }}>
                {filteredMRs.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>No MRs found</div>
                ) : (
                  <div className="mr-grid">
                    {filteredMRs.map((mr, i) => (
                      <MRCard
                        key={mr._id || mr.agentId || i}
                        mr={mr}
                        index={i}
                        isSelected={selectedMR?._id === mr._id || selectedMR?.agentId === mr.agentId}
                        onSelect={setSelectedMR}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TABLE VIEW */}
            {chartType === "table" && (
              <div style={{ marginBottom: 16 }}>
                <SectionCard title="MR Performance Table" subtitle="All field representatives">
                  <div className="scroll-table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>MR Name</th>
                          <th>Area / Zone</th>
                          <th>Jobs</th>
                          <th>Completed</th>
                          <th>Orders</th>
                          <th>Responses</th>
                          <th>Samples</th>
                          <th>Doctors</th>
                          <th>Dist (km)</th>
                          <th>Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMRs.length > 0 ? filteredMRs.map((mr, i) => {
                          const color = MR_PALETTE[i % MR_PALETTE.length];
                          const rate = mr.completionRate ?? 0;
                          return (
                            <tr key={mr._id || i} style={{ cursor: "pointer" }} onClick={() => setSelectedMR(mr)}>
                              <td style={{ fontWeight: 700, color: "#94a3b8" }}>
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{
                                    width: 30, height: 30, borderRadius: "50%", background: color + "20",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 11, fontWeight: 800, color, flexShrink: 0
                                  }}>
                                    {(mr.name || "MR").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{mr.name || "—"}</span>
                                </div>
                              </td>
                              <td style={{ color: "#64748b" }}>{mr.area || mr.zone || "—"}</td>
                              <td style={{ fontWeight: 600 }}>{mr.jobs ?? 0}</td>
                              <td>{mr.completed ?? 0}</td>
                              <td style={{ fontWeight: 600, color: COLORS.amber }}>{mr.orders ?? 0}</td>
                              <td>{mr.responses ?? 0}</td>
                              <td>{mr.samplesGiven ?? 0}</td>
                              <td>{mr.doctorsCovered ?? 0}</td>
                              <td>{mr.distanceKm ?? 0}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div className="progress-bar" style={{ width: 50 }}>
                                    <div className="progress-fill" style={{
                                      width: `${Math.min(rate, 100)}%`,
                                      background: rate >= 70 ? COLORS.emerald : rate >= 40 ? COLORS.amber : COLORS.rose
                                    }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{rate}%</span>
                                </div>
                              </td>
                              <td>
                                <Badge
                                  label={rate >= 70 ? "On Track" : rate >= 40 ? "Moderate" : "Low"}
                                  color={rate >= 70 ? COLORS.emerald : rate >= 40 ? COLORS.amber : COLORS.rose}
                                />
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan={12} style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0" }}>No MRs found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* SELECTED MR DETAIL */}
            {selectedMR && (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                  padding: "12px 16px", background: "white", borderRadius: 12,
                  border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.06)"
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: COLORS.blue + "20", color: COLORS.blue,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 13
                  }}>
                    {(selectedMR.name || "MR").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{selectedMR.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {selectedMR.area || selectedMR.zone || "—"} · Viewing detailed breakdown
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={`${selectedMR.completionRate ?? 0}% completion`}
                      color={(selectedMR.completionRate ?? 0) >= 70 ? COLORS.emerald : COLORS.amber} />
                    <Badge label={`${selectedMR.jobs ?? 0} jobs`} color={COLORS.blue} />
                    <Badge label={`${selectedMR.orders ?? 0} orders`} color={COLORS.amber} />
                  </div>
                </div>

                <div className="grid32" style={{ marginBottom: 16 }}>
                  {/* Trend Chart */}
                  <SectionCard
                    title={`${selectedMR.name?.split(" ")[0] || "MR"}'s Daily Activity`}
                    subtitle="Jobs, responses, orders over time"
                  >
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="mrBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.blue} stopOpacity={.25} />
                              <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="mrGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={.2} />
                              <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Area type="monotone" dataKey="jobs" name="Jobs" stroke={COLORS.blue} fill="url(#mrBlue)" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="responses" name="Responses" stroke={COLORS.emerald} fill="url(#mrGreen)" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="orders" name="Orders" stroke={COLORS.amber} fill="none" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: 13 }}>
                        No daily breakdown available for this MR
                      </div>
                    )}
                  </SectionCard>

                  {/* Radar Chart */}
                  <SectionCard title="Performance Radar" subtitle="Multi-metric overview">
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <Radar name={selectedMR.name} dataKey="value"
                          stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.18} strokeWidth={2} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>

                {/* MR Area / Doctor breakdown table */}
                {selectedMR.areaBreakdown?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <SectionCard title={`${selectedMR.name?.split(" ")[0]}'s Area Breakdown`} subtitle="Area-wise performance">
                      <div className="scroll-table">
                        <table className="data-table">
                          <thead>
                            <tr><th>Area</th><th>Jobs</th><th>Completed</th><th>Doctors</th><th>Distance</th><th>Rate</th></tr>
                          </thead>
                          <tbody>
                            {selectedMR.areaBreakdown.map((a, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600, color: "#0f172a" }}>{a.area}</td>
                                <td>{a.jobs}</td>
                                <td>{a.completed}</td>
                                <td>{a.doctors ?? 0}</td>
                                <td>{a.distanceKm} km</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div className="progress-bar" style={{ width: 50 }}>
                                      <div className="progress-fill" style={{
                                        width: `${a.rate ?? 0}%`,
                                        background: (a.rate ?? 0) >= 70 ? COLORS.emerald : (a.rate ?? 0) >= 40 ? COLORS.amber : COLORS.rose
                                      }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{a.rate ?? 0}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* Top Products for selected MR */}
                {selectedMR.topProducts?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <SectionCard title={`${selectedMR.name?.split(" ")[0]}'s Top Products`} subtitle="Promoted products">
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {selectedMR.topProducts.map((prod, i) => (
                          <div key={prod.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: "50%", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              background: i < 3 ? COLORS.amber + "22" : "#f1f5f9",
                              fontSize: 11, fontWeight: 800,
                              color: i < 3 ? COLORS.amber : "#94a3b8"
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {prod.name}
                              </div>
                              <div className="progress-bar" style={{ marginTop: 3 }}>
                                <div className="progress-fill" style={{
                                  width: `${(prod.count / (selectedMR.topProducts[0]?.count || 1)) * 100}%`,
                                  background: MR_PALETTE[i % MR_PALETTE.length]
                                }} />
                              </div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", minWidth: 24, textAlign: "right" }}>{prod.count}</span>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  </div>
                )}
              </>
            )}

            {/* LEADERBOARD */}
            <SectionCard
              title="🏆 MR Leaderboard"
              subtitle="Ranked by completion rate"
              action={
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="completionRate">By Completion %</option>
                  <option value="jobs">By Jobs</option>
                  <option value="orders">By Orders</option>
                  <option value="responses">By Responses</option>
                </select>
              }
            >
              <div className="scroll-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th><th>MR Name</th><th>Area</th>
                      <th>Jobs</th><th>Orders</th><th>Responses</th>
                      <th>Dist (km)</th><th>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredMRs].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0)).slice(0, 10).map((mr, i) => {
                      const rate = mr.completionRate ?? 0;
                      return (
                        <tr key={mr._id || i} onClick={() => setSelectedMR(mr)} style={{ cursor: "pointer" }}>
                          <td>
                            <span style={{ fontSize: 16 }}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span style={{ fontWeight: 700, color: "#94a3b8" }}>{i + 1}</span>}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: "#0f172a" }}>{mr.name || "—"}</td>
                          <td style={{ color: "#64748b" }}>{mr.area || mr.zone || "—"}</td>
                          <td>{mr.jobs ?? 0}</td>
                          <td style={{ fontWeight: 600, color: COLORS.amber }}>{mr.orders ?? 0}</td>
                          <td>{mr.responses ?? 0}</td>
                          <td>{mr.distanceKm ?? 0}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div className="progress-bar" style={{ width: 60 }}>
                                <div className="progress-fill" style={{
                                  width: `${Math.min(rate, 100)}%`,
                                  background: rate >= 70 ? COLORS.emerald : rate >= 40 ? COLORS.amber : COLORS.rose
                                }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 70 ? COLORS.emerald : rate >= 40 ? COLORS.amber : COLORS.rose }}>
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </>
  );
}