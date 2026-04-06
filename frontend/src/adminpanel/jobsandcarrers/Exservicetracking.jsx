import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

// ─── Pipeline Stages ────────────────────────────────────────────────────────
const STAGES = [
  { key: "application_filled", label: "Application Filled", short: "Applied" },
  { key: "online_test",        label: "Online Test",         short: "Test"    },
  { key: "result",             label: "Result",              short: "Result"  },
  { key: "interview",          label: "Interview",           short: "Interview"},
  { key: "offer_letter",       label: "Issue Offer Letter",  short: "Offer"   },
  { key: "joining",            label: "Joining",             short: "Joining" },
];

const STAGE_COLORS = {
  application_filled: { bg: "#fef9c3", color: "#854d0e", bar: "#facc15", dot: "#d97706" },
  online_test:        { bg: "#eff6ff", color: "#1d4ed8", bar: "#60a5fa", dot: "#3b82f6" },
  result:             { bg: "#f0fdf4", color: "#15803d", bar: "#4ade80", dot: "#22c55e" },
  interview:          { bg: "#fdf4ff", color: "#7e22ce", bar: "#c084fc", dot: "#a855f7" },
  offer_letter:       { bg: "#fff7ed", color: "#c2410c", bar: "#fb923c", dot: "#f97316" },
  joining:            { bg: "#f0fdfa", color: "#0f766e", bar: "#2dd4bf", dot: "#14b8a6" },
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

// ─── Stage Badge ─────────────────────────────────────────────────────────────
const StageBadge = ({ stageKey }) => {
  const stage = STAGES.find((s) => s.key === stageKey) || STAGES[0];
  const c = STAGE_COLORS[stage.key];
  return (
    <span style={{ ...s.chip, background: c.bg, color: c.color, border: `1px solid ${c.bar}` }}>
      {stage.label}
    </span>
  );
};

// ─── Pipeline Progress Bar ────────────────────────────────────────────────────
const PipelineBar = ({ currentStage }) => {
  const currentIdx = STAGES.findIndex((st) => st.key === currentStage);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 8 }}>
      {STAGES.map((st, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const c = STAGE_COLORS[st.key];
        return (
          <div key={st.key} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: done ? "#22c55e" : active ? c.dot : "#e2e8f0",
                  border: `2px solid ${done ? "#16a34a" : active ? c.dot : "#cbd5e1"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: done || active ? "#fff" : "#94a3b8",
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                }}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: active ? c.color : done ? "#16a34a" : "#94a3b8",
                  marginTop: 3,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {st.short}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                style={{
                  height: 2,
                  flex: 1,
                  background: done ? "#22c55e" : "#e2e8f0",
                  marginBottom: 14,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Stage Updater Dropdown ───────────────────────────────────────────────────
const StageUpdater = ({ applicant, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("adminToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const handleChange = async (e) => {
    const newStage = e.target.value;
    setLoading(true);
    try {
      await axios.patch(
        `${BASE_API}/api/exservice-jobs/applications/${applicant._id}/stage`,
        { stage: newStage },
        { headers }
      );
      toast.success("Stage updated!");
      onUpdated();
    } catch {
      toast.error("Failed to update stage");
    } finally {
      setLoading(false);
    }
  };

  const current = applicant.stage || "application_filled";
  const c = STAGE_COLORS[current] || STAGE_COLORS.application_filled;

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={loading}
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 8px",
        borderRadius: 20,
        border: `1px solid ${c.bar}`,
        background: c.bg,
        color: c.color,
        cursor: loading ? "wait" : "pointer",
        outline: "none",
      }}
    >
      {STAGES.map((st) => (
        <option key={st.key} value={st.key}>
          {st.label}
        </option>
      ))}
    </select>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExServiceTracking() {
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const w = useWidth();
  const isMobile = w < 640;
  const isTablet = w < 1024;

  const token = localStorage.getItem("adminToken") || "";
  const headers = { Authorization: `Bearer ${token}` };

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
      toast.error("Failed to load tracking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Grouped by job ──────────────────────────────────────────────────────────
  const grouped = jobs.map((job) => {
    const jobApps = apps.filter(
      (a) => a.applyingFor?.toLowerCase().trim() === job.title?.toLowerCase().trim()
    );
    const counts = STAGES.reduce((acc, st) => {
      acc[st.key] = jobApps.filter((a) => (a.stage || "application_filled") === st.key).length;
      return acc;
    }, {});
    return { job, apps: jobApps, counts, total: jobApps.length };
  });

  const knownTitles = jobs.map((j) => j.title?.toLowerCase().trim());
  const uncategorized = apps.filter(
    (a) => !knownTitles.includes(a.applyingFor?.toLowerCase().trim())
  );

  const filtered = grouped.filter(
    (g) =>
      !search ||
      g.job.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.job.department?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Summary stats ───────────────────────────────────────────────────────────
  const stageTotals = STAGES.reduce((acc, st) => {
    acc[st.key] = apps.filter((a) => (a.stage || "application_filled") === st.key).length;
    return acc;
  }, {});

  // ═══════════════════════════════════════════════════════════════════════════
  // DRILL-DOWN VIEW — individual job applicants
  // ═══════════════════════════════════════════════════════════════════════════
  if (selected) {
    const { job, apps: jApps } = selected;

    const displayApps =
      stageFilter === "all"
        ? jApps
        : jApps.filter((a) => (a.stage || "application_filled") === stageFilter);

    return (
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <button onClick={() => { setSelected(null); setStageFilter("all"); }} style={s.backBtn}>
              ← Back to Tracking
            </button>
            <p style={s.label}>Jobs & ExService Zone</p>
            <h1 style={{ ...s.title, fontSize: isMobile ? 18 : 22 }}>{job.title}</h1>
            <p style={s.sub}>
              {[job.serviceArm, job.department, job.location].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {jApps.length} applicant{jApps.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Stage mini-stats */}
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, minWidth: isMobile ? 560 : "auto" }}>
            <div
              onClick={() => setStageFilter("all")}
              style={{
                ...s.miniStat,
                flex: "1 0 70px",
                cursor: "pointer",
                borderTop: `3px solid #64748b`,
                background: stageFilter === "all" ? "#f1f5f9" : "#fff",
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>{jApps.length}</p>
              <p style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>All</p>
            </div>
            {STAGES.map((st) => {
              const c = STAGE_COLORS[st.key];
              const count = jApps.filter((a) => (a.stage || "application_filled") === st.key).length;
              return (
                <div
                  key={st.key}
                  onClick={() => setStageFilter(st.key)}
                  style={{
                    ...s.miniStat,
                    borderTop: `3px solid ${c.bar}`,
                    flex: "1 0 70px",
                    cursor: "pointer",
                    background: stageFilter === st.key ? c.bg : "#fff",
                  }}
                >
                  <p style={{ fontSize: 18, fontWeight: 700, color: c.color, margin: 0 }}>{count}</p>
                  <p style={{ fontSize: 10, color: "#64748b", textTransform: "capitalize", marginTop: 3 }}>
                    {st.short}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applicant list */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayApps.length === 0 ? (
              <div style={s.empty}>No applicants at this stage.</div>
            ) : (
              displayApps.map((a) => {
                const stage = a.stage || "application_filled";
                const c = STAGE_COLORS[stage];
                return (
                  <div key={a._id} style={{ ...s.mCard, borderLeft: `3px solid ${c.bar}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", margin: 0 }}>
                        {a.fullName}
                      </p>
                      <StageUpdater applicant={a} onUpdated={fetchAll} />
                    </div>
                    <PipelineBar currentStage={stage} />
                    <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>
                      {a.serviceArm} · {a.rank || "—"}
                    </p>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0" }}>{a.email}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{fmt(a.createdAt)}</p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["#", "Name", "Email", "Service Arm", "Rank", "Pipeline", "Applied On", "Stage"].map(
                    (h) => <th key={h} style={s.th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#94a3b8", padding: 40 }}>
                      No applicants at this stage.
                    </td>
                  </tr>
                ) : (
                  displayApps.map((a, i) => {
                    const stage = a.stage || "application_filled";
                    return (
                      <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={s.td}>{i + 1}</td>
                        <td style={s.td}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>
                            {a.fullName}
                          </p>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                            {a.city}, {a.state}
                          </p>
                        </td>
                        <td style={s.td}><span style={{ fontSize: 13 }}>{a.email}</span></td>
                        <td style={s.td}><span style={{ fontSize: 13 }}>{a.serviceArm || "—"}</span></td>
                        <td style={s.td}><span style={{ fontSize: 13 }}>{a.rank || "—"}</span></td>
                        <td style={{ ...s.td, minWidth: 320 }}>
                          <PipelineBar currentStage={stage} />
                        </td>
                        <td style={s.td}>
                          <span style={{ fontSize: 13, color: "#64748b" }}>{fmt(a.createdAt)}</span>
                        </td>
                        <td style={s.td}>
                          <StageUpdater applicant={a} onUpdated={fetchAll} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN TRACKING VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.label}>Jobs & ExService Zone</p>
          <h1 style={{ ...s.title, fontSize: isMobile ? 18 : 24 }}>Ex-Service Recruitment Tracking</h1>
          <p style={s.sub}>Pipeline overview across all veteran job postings</p>
        </div>
        <button onClick={fetchAll} style={s.refreshBtn}>↺ Refresh</button>
      </div>

      {/* Pipeline stage overview */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Recruitment Pipeline Overview
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(3,1fr)" : "repeat(6,1fr)",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {STAGES.map((st) => {
            const c = STAGE_COLORS[st.key];
            const count = stageTotals[st.key] || 0;
            const pct = apps.length > 0 ? Math.round((count / apps.length) * 100) : 0;
            return (
              <div key={st.key} style={{ ...s.statCard, borderTop: `3px solid ${c.bar}` }}>
                <p style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: c.color, margin: "0 0 2px" }}>
                  {count}
                </p>
                <p style={{ fontSize: 11, color: "#334155", margin: "0 0 6px", fontWeight: 600 }}>
                  {st.label}
                </p>
                <div style={{ height: 4, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: c.bar, borderRadius: 4 }} />
                </div>
                <p style={{ fontSize: 10, color: "#94a3b8", margin: "4px 0 0" }}>{pct}% of total</p>
              </div>
            );
          })}
        </div>

        {/* Total summary row */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Total Applications: {apps.length}
          </span>
          <span style={{ fontSize: 13, color: "#64748b" }}>Open Positions: {jobs.length}</span>
          <span style={{ fontSize: 13, color: "#14b8a6", fontWeight: 600 }}>
            Joined: {stageTotals.joining || 0}
          </span>
          <span style={{ fontSize: 13, color: "#f97316", fontWeight: 600 }}>
            Offer Letters Issued: {stageTotals.offer_letter || 0}
          </span>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: 20,
        }}
      >
        <input
          type="text"
          placeholder="Search by job title or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...s.input, flex: 1 }}
        />
        <span style={{ fontSize: 13, color: "#94a3b8", flexShrink: 0 }}>
          {filtered.length} position{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Job cards */}
      {loading ? (
        <div style={s.empty}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>No job postings found.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(auto-fill,minmax(380px,1fr))",
            gap: 16,
          }}
        >
          {filtered.map(({ job, apps: jApps, counts, total }) => {
            const arm = job.serviceArm || "Any";
            const ARM_BADGE = {
              Army: { bg: "#fef9c3", color: "#854d0e" },
              Navy: { bg: "#eff6ff", color: "#1d4ed8" },
              "Air Force": { bg: "#f5f3ff", color: "#6d28d9" },
              Any: { bg: "#f1f5f9", color: "#475569" },
            };
            const ab = ARM_BADGE[arm] || ARM_BADGE.Any;

            // Furthest stage with applicants
            const activeStageIdx = [...STAGES].reverse().findIndex(
              (st) => (counts[st.key] || 0) > 0
            );
            const highestActive = activeStageIdx >= 0 ? STAGES[STAGES.length - 1 - activeStageIdx] : null;

            return (
              <div key={job._id} style={s.card}>
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ ...s.chip, background: ab.bg, color: ab.color }}>{arm}</span>
                      {job.minRank && (
                        <span style={{ ...s.chip, background: "#f8fafc", color: "#475569" }}>
                          {job.minRank}+
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 3px" }}>
                      {job.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {[job.department, job.location, job.jobType].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>{total}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                      applicant{total !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Pipeline stage bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {STAGES.map((st) => {
                    const count = counts[st.key] || 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const c = STAGE_COLORS[st.key];
                    return (
                      <div key={st.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{st.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{count}</span>
                        </div>
                        <div
                          style={{ height: 5, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: c.bar,
                              borderRadius: 4,
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stage chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {STAGES.map((st) => {
                    const count = counts[st.key] || 0;
                    if (!count) return null;
                    const c = STAGE_COLORS[st.key];
                    return (
                      <span
                        key={st.key}
                        style={{ ...s.chip, background: c.bg, color: c.color, border: `1px solid ${c.bar}` }}
                      >
                        {count} {st.short}
                      </span>
                    );
                  })}
                  {total === 0 && (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>No applications yet</span>
                  )}
                </div>

                {/* Meta row */}
                {total > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {[
                      `Joined: ${counts.joining || 0}`,
                      `Offers: ${counts.offer_letter || 0}`,
                      `Posted: ${fmt(job.createdAt)}`,
                    ].map((t, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          background: "#f8fafc",
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {highestActive && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Latest active stage: </span>
                    <StageBadge stageKey={highestActive.key} />
                  </div>
                )}

                <button
                  onClick={() => setSelected({ job, apps: jApps })}
                  style={s.viewBtn}
                >
                  View {total} Candidate{total !== 1 ? "s" : ""} →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Uncategorized / Walk-in */}
      {uncategorized.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Walk-in / Other ({uncategorized.length})
          </p>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Name", "Applying For", "Service Arm", "Email", "Applied On", "Stage"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uncategorized.map((a, i) => (
                  <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={s.td}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>
                        {a.fullName}
                      </p>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          fontSize: 12,
                          background: "#eff8fb",
                          color: "#0077a3",
                          padding: "3px 10px",
                          borderRadius: 20,
                          border: "1px solid #bae6fd",
                        }}
                      >
                        {a.applyingFor}
                      </span>
                    </td>
                    <td style={s.td}><span style={{ fontSize: 13 }}>{a.serviceArm || "—"}</span></td>
                    <td style={s.td}><span style={{ fontSize: 13 }}>{a.email}</span></td>
                    <td style={s.td}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>{fmt(a.createdAt)}</span>
                    </td>
                    <td style={s.td}>
                      <StageUpdater applicant={a} onUpdated={fetchAll} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 0 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
    flexWrap: "wrap",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0077a3",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 4,
  },
  title: { fontWeight: 700, color: "#0f172a" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  refreshBtn: {
    padding: "8px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    color: "#0077a3",
    cursor: "pointer",
    padding: 0,
    marginBottom: 8,
    display: "block",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "14px 16px",
    textAlign: "center",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 18,
    display: "flex",
    flexDirection: "column",
  },
  chip: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 9px",
    borderRadius: 20,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },
  viewBtn: {
    padding: "9px 14px",
    background: "#f0f9ff",
    color: "#0077a3",
    border: "1px solid #bae6fd",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    marginTop: "auto",
  },
  input: {
    padding: "9px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 13,
    color: "#374151",
    outline: "none",
  },
  tableWrap: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 550 },
  th: {
    padding: "11px 14px",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textAlign: "left",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "11px 14px", verticalAlign: "middle" },
  miniStat: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "12px 10px",
    textAlign: "center",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  mCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 14,
  },
  empty: { textAlign: "center", padding: "48px 20px", color: "#94a3b8", fontSize: 14 },
};