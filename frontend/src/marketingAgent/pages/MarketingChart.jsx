import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  TrendingUp, Activity, Users, MapPin, Target, Package,
  ChevronDown, Download, Printer, RefreshCw, Calendar,
  AlertCircle, Loader2, BarChart2, Map, Clock, Star,
  ArrowUp, ArrowDown, Minus, Filter, Eye
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
  rose: "#f43f5e", slate: "#64748b",
};
const PIE_COLORS = [COLORS.blue, COLORS.sky, COLORS.indigo, COLORS.amber, COLORS.emerald, COLORS.rose];

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

const StatCard = ({ label, value, sub, icon: Icon, color, trend }) => (
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
    {trend !== undefined && (
      <div style={{
        display: "flex", alignItems: "center", gap: 4, fontSize: 12,
        color: trend > 0 ? "#10b981" : trend < 0 ? "#f43f5e" : "#94a3b8"
      }}>
        {trend > 0 ? <ArrowUp size={12} /> : trend < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
        {Math.abs(trend)}% vs last period
      </div>
    )}
  </div>
);

const SectionCard = ({ title, subtitle, children, action }) => (
  <div style={{
    background: "white", borderRadius: 16, padding: "20px 22px",
    boxShadow: "0 1px 4px rgba(0,0,0,.07)", border: "1px solid #f1f5f9",
  }}>
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

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{
    display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2,
    scrollbarWidth: "none", WebkitOverflowScrolling: "touch"
  }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)} style={{
        padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
        background: active === t.key ? COLORS.blue : "#f1f5f9",
        color: active === t.key ? "white" : "#64748b",
        transition: "all .18s",
      }}>{t.label}</button>
    ))}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: color + "18", color,
  }}>{label}</span>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "white", border: "1px solid #e2e8f0", borderRadius: 10,
      padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.1)"
    }}>
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

/* ── DATE RANGE PICKER ── */
const DateRangePicker = ({ fromDate, toDate, onFromChange, onToChange, onApply }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "8px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.06)"
  }}>
    <Calendar size={14} style={{ color: COLORS.blue, flexShrink: 0 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>FROM</label>
      <input
        type="date"
        value={fromDate}
        onChange={e => onFromChange(e.target.value)}
        style={{
          border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 9px",
          fontSize: 12, color: "#374151", outline: "none", cursor: "pointer",
          background: "#f8fafc"
        }}
      />
    </div>
    <span style={{ color: "#cbd5e1", fontSize: 14 }}>→</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>TO</label>
      <input
        type="date"
        value={toDate}
        onChange={e => onToChange(e.target.value)}
        style={{
          border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 9px",
          fontSize: 12, color: "#374151", outline: "none", cursor: "pointer",
          background: "#f8fafc"
        }}
      />
    </div>
    <button
      onClick={onApply}
      style={{
        background: COLORS.blue, color: "white", border: "none",
        borderRadius: 8, padding: "6px 14px", fontSize: 12,
        fontWeight: 600, cursor: "pointer"
      }}
    >
      Apply
    </button>
  </div>
);

/* ─── MAIN PAGE ─── */
export default function MarketingChartPage() {
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("thisMonth");
  const [chartTab, setChartTab] = useState("activity");
  const [areaFilter, setAreaFilter] = useState("all");

  // Date range state
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
      }
      const data = await apiFetch(url);
      setPerf(data.performance);
    } catch (e) {
      setError(e.message || "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  }, [period, appliedFrom, appliedTo]);

  useEffect(() => { load(); }, [load]);

  const handleApplyDateRange = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setPeriod("custom");
  };

  const p = perf;
  const periodData = p
    ? period === "today" ? p.today
    : period === "thisWeek" ? p.thisWeek
    : period === "custom" ? p.custom ?? p.thisMonth
    : p.thisMonth
    : null;

  const daily = p?.dailyBreakdown || [];
  const areaData = p?.areaPerformance || [];
  const partnerData = Object.entries(p?.partnerBreakdown || {}).map(([name, value]) => ({ name, value }));
  const responseData = Object.entries(p?.responseBreakdown || {}).map(([name, value]) => ({ name, value }));
  const topProducts = p?.topProducts || [];
  const recent = p?.recentActivity || [];
  const samples = p?.sampleStockSummary || [];
  const filteredArea = areaFilter === "all" ? areaData : areaData.filter(a => a.area === areaFilter);

  const radarData = periodData ? [
    { metric: "Jobs", value: periodData.jobs },
    { metric: "Responses", value: periodData.responses },
    { metric: "Orders", value: periodData.orders },
    { metric: "Samples", value: periodData.samplesGiven },
    { metric: "Products", value: periodData.productsDetailed },
    { metric: "Distance", value: periodData.distanceKm },
  ] : [];

  const exportCSV = () => {
    const rows = [["Date", "Jobs", "Completed", "Responses", "Orders", "Distance(km)"],
      ...daily.map(d => [d.date, d.jobs, d.completed, d.responses, d.orders, d.distanceKm])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `marketing-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const css = `
    * { box-sizing: border-box; }
    body { margin:0; font-family: 'DM Sans', system-ui, sans-serif; background:#f8fafc; }
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .grid32 { display:grid; grid-template-columns:1.5fr 1fr; gap:14px; }
    @media(max-width:900px){
      .grid4{grid-template-columns:repeat(2,1fr)!important;}
      .grid32{grid-template-columns:1fr!important;}
      .grid3{grid-template-columns:repeat(2,1fr)!important;}
    }
    @media(max-width:560px){
      .grid4{grid-template-columns:1fr!important;}
      .grid3{grid-template-columns:1fr!important;}
      .grid2{grid-template-columns:1fr!important;}
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
    .btn-primary { background:#1d4ed8; color:white; }
    .btn-primary:hover { background:#1e40af; }
    .btn-ghost { background:#f1f5f9; color:#475569; }
    .btn-ghost:hover { background:#e2e8f0; }
    select { padding:7px 10px; border-radius:8px; border:1px solid #e2e8f0;
      font-size:12px; color:#374151; background:white; outline:none; cursor:pointer; }
    .progress-bar { height:6px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:99px; transition:width .6s ease; }
    input[type="date"]::-webkit-calendar-picker-indicator { opacity:0.6; cursor:pointer; }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ padding: "20px 20px 40px", maxWidth: 1280, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, marginBottom: 22
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Reports & Analytics</span>
              <span style={{ color: "#cbd5e1" }}>/</span>
              <span style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700 }}>Marketing Chart</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
              Agent Performance Dashboard
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              Your field activity, targets, and analytics in one view
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
            </button>
            <button className="btn btn-ghost" onClick={exportCSV}><Download size={13} /> Export CSV</button>
            <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={13} /> Print</button>
          </div>
        </div>

        {/* PERIOD SELECTOR + DATE RANGE */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <TabBar
            tabs={[
              { key: "today", label: "Today" },
              { key: "thisWeek", label: "This Week" },
              { key: "thisMonth", label: "This Month" },
              { key: "custom", label: "Custom Range" },
            ]}
            active={period}
            onChange={(key) => {
              setPeriod(key);
              if (key !== "custom") setFromDate(firstOfMonth); // reset on switch
            }}
          />
          {p && (
            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
              <Clock size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Live data
            </span>
          )}
        </div>

        {/* DATE RANGE PICKER — shown when Custom Range tab active */}
        {period === "custom" && (
          <div style={{ marginBottom: 20 }}>
            <DateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
              onApply={handleApplyDateRange}
            />
            {appliedFrom && appliedTo && (
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                Showing report from <strong>{appliedFrom}</strong> to <strong>{appliedTo}</strong>
              </p>
            )}
          </div>
        )}

        {loading && <Spinner />}
        {error && <ErrorBox msg={error} />}

        {!loading && !error && p && (
          <>
            {/* OVERVIEW KPI CARDS */}
            <div className="grid4" style={{ marginBottom: 16 }}>
              <StatCard label="Total Jobs" value={p.overview.totalJobs}
                sub={`${p.overview.completedJobs} completed`}
                icon={Activity} color={COLORS.blue} />
              <StatCard label="Distance Covered" value={`${p.overview.totalDistanceKm} km`}
                sub="All-time field distance"
                icon={MapPin} color={COLORS.emerald} />
              <StatCard label="Total Responses" value={p.overview.totalResponses}
                sub={`${p.overview.totalOrders} orders placed`}
                icon={Users} color={COLORS.indigo} />
              <StatCard label="Completion Rate" value={`${p.overview.completionRate}%`}
                sub={p.overview.isGpsBlocked ? "⚠ GPS Blocked" : `${p.overview.gpsViolations} GPS violations`}
                icon={Target} color={p.overview.completionRate >= 70 ? COLORS.emerald : COLORS.amber} />
            </div>

            {/* PERIOD KPI CARDS */}
            {periodData && (
              <div className="grid4" style={{ marginBottom: 16 }}>
                <StatCard
                  label={period === "today" ? "Today's Jobs" : period === "thisWeek" ? "Week's Jobs" : period === "custom" ? "Period Jobs" : "Month's Jobs"}
                  value={periodData.jobs} sub={`${periodData.completed} completed · ${periodData.completionRate}%`}
                  icon={Activity} color={COLORS.sky} />
                <StatCard label="Responses" value={periodData.responses}
                  sub={`${periodData.positiveResp} positive`}
                  icon={Star} color={COLORS.violet} />
                <StatCard label="Orders" value={periodData.orders}
                  icon={BarChart2} color={COLORS.amber} />
                <StatCard label="Distance" value={`${periodData.distanceKm} km`}
                  icon={Map} color={COLORS.rose} />
              </div>
            )}

            {/* MONTHLY TARGET vs ACHIEVEMENT */}
            {(period === "thisMonth" || period === "custom") && p.thisMonth?.target && (
              <div style={{ marginBottom: 16 }}>
                <SectionCard title="Monthly Targets vs Achievement" subtitle="Current month progress">
                  <div className="grid3" style={{ marginTop: 4 }}>
                    {[
                      { label: "Jobs", done: p.thisMonth.jobs, target: p.thisMonth.target.jobs, rate: p.thisMonth.achievement.jobsRate, color: COLORS.blue },
                      { label: "Doctors", done: p.thisMonth.achievement.doctorsCovered, target: p.thisMonth.target.doctors, rate: p.thisMonth.achievement.doctorsRate, color: COLORS.indigo },
                      { label: "Orders", done: p.thisMonth.orders, target: p.thisMonth.target.orders, rate: p.thisMonth.achievement.ordersRate, color: COLORS.emerald },
                    ].map(t => (
                      <div key={t.label} style={{ padding: "14px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{t.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.done} / {t.target || "—"}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(t.rate, 100)}%`, background: t.color }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{t.rate}% achieved</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* DAILY ACTIVITY CHART */}
            <div style={{ marginBottom: 16 }}>
              <SectionCard
                title={period === "custom" ? `Activity Trend (${appliedFrom} → ${appliedTo})` : "30-Day Activity Trend"}
                subtitle="Daily breakdown of jobs, responses, orders, and distance"
                action={
                  <TabBar
                    tabs={[
                      { key: "activity", label: "Activity" },
                      { key: "distance", label: "Distance" },
                      { key: "products", label: "Products" },
                    ]}
                    active={chartTab}
                    onChange={setChartTab}
                  />
                }
              >
                <ResponsiveContainer width="100%" height={240}>
                  {chartTab === "activity" ? (
                    <AreaChart data={daily} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.blue} stopOpacity={.25} />
                          <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gEm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={.2} />
                          <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.amber} stopOpacity={.2} />
                          <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="jobs" name="Jobs" stroke={COLORS.blue} fill="url(#gBlue)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="responses" name="Responses" stroke={COLORS.emerald} fill="url(#gEm)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="orders" name="Orders" stroke={COLORS.amber} fill="url(#gAmber)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  ) : chartTab === "distance" ? (
                    <BarChart data={daily} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="distanceKm" name="Distance (km)" fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={daily} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="productsDetailed" name="Products" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="samplesGiven" name="Samples" fill={COLORS.sky} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* PIE CHARTS ROW */}
            <div className="grid3" style={{ marginBottom: 16 }}>
              <SectionCard title="Partner Mix" subtitle="Visit distribution">
                {partnerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={partnerData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {partnerData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0", fontSize: 13 }}>No data yet</div>}
              </SectionCard>

              <SectionCard title="Response Status" subtitle="Outcome distribution">
                {responseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={responseData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {responseData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0", fontSize: 13 }}>No data yet</div>}
              </SectionCard>

              <SectionCard title="Performance Radar" subtitle={period === "today" ? "Today" : period === "thisWeek" ? "This week" : period === "custom" ? "Custom range" : "This month"}>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Radar name="Performance" dataKey="value" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.18} strokeWidth={2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0", fontSize: 13 }}>No data yet</div>}
              </SectionCard>
            </div>

            {/* AREA PERFORMANCE TABLE */}
            <div className="grid32" style={{ marginBottom: 16 }}>
              <SectionCard
                title="Area-wise Performance"
                subtitle="Top 10 areas by visits"
                action={
                  areaData.length > 0 && (
                    <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
                      <option value="all">All Areas</option>
                      {areaData.map(a => <option key={a.area} value={a.area}>{a.area}</option>)}
                    </select>
                  )
                }
              >
                <div className="scroll-table">
                  <table className="data-table">
                    <thead>
                      <tr><th>Area</th><th>Jobs</th><th>Done</th><th>Distance</th><th>Doctors</th><th>Rate</th></tr>
                    </thead>
                    <tbody>
                      {filteredArea.length > 0 ? filteredArea.map(a => (
                        <tr key={a.area}>
                          <td style={{ fontWeight: 600, color: "#0f172a" }}>{a.area}</td>
                          <td>{a.jobs}</td>
                          <td>{a.completed}</td>
                          <td>{a.distanceKm} km</td>
                          <td>{a.doctors}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div className="progress-bar" style={{ width: 50 }}>
                                <div className="progress-fill" style={{
                                  width: `${a.rate}%`,
                                  background: a.rate >= 70 ? COLORS.emerald : a.rate >= 40 ? COLORS.amber : COLORS.rose
                                }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{a.rate}%</span>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0" }}>No area data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Top Products Promoted" subtitle="By number of visits">
                {topProducts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {topProducts.map((prod, i) => (
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
                              width: `${(prod.count / (topProducts[0]?.count || 1)) * 100}%`,
                              background: PIE_COLORS[i % PIE_COLORS.length]
                            }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", minWidth: 24, textAlign: "right" }}>{prod.count}</span>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0", fontSize: 13 }}>No product data</div>}
              </SectionCard>
            </div>

            {/* SAMPLE STOCK */}
            {samples.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <SectionCard title="Sample Stock Summary" subtitle="Opening stock, issued & balance">
                  <div className="scroll-table">
                    <table className="data-table">
                      <thead>
                        <tr><th>Product</th><th>Opening Stock</th><th>Issued</th><th>Balance</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {samples.map(s => (
                          <tr key={s.productName}>
                            <td style={{ fontWeight: 600, color: "#0f172a" }}>{s.productName}</td>
                            <td>{s.openingStock}</td>
                            <td>{s.issued}</td>
                            <td style={{ fontWeight: 700, color: s.balance <= 5 ? COLORS.rose : COLORS.emerald }}>{s.balance}</td>
                            <td>{s.balance <= 5 ? <Badge label="Low Stock" color={COLORS.rose} /> : <Badge label="In Stock" color={COLORS.emerald} />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* RECENT ACTIVITY */}
            <SectionCard title="Recent Activity" subtitle="Last 10 field visits">
              <div className="scroll-table">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Doctor</th><th>Hospital</th><th>Area</th><th>Partner</th><th>Dist (km)</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recent.length > 0 ? recent.map(r => (
                      <tr key={r._id}>
                        <td style={{ whiteSpace: "nowrap", color: "#64748b" }}>
                          {r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{r.doctorName || "—"}</td>
                        <td style={{ color: "#64748b" }}>{r.hospitalName || "—"}</td>
                        <td>{r.area}</td>
                        <td>{r.partner}</td>
                        <td>{r.distanceKm}</td>
                        <td>
                          <Badge
                            label={r.status === "closed" ? "Done" : r.status === "force_closed" ? "Cancelled" : "Active"}
                            color={r.status === "closed" ? COLORS.emerald : r.status === "force_closed" ? COLORS.rose : COLORS.amber}
                          />
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0" }}>No recent activity</td></tr>
                    )}
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