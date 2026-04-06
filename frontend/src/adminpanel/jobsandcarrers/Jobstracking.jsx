import { useEffect, useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

// ─── Pipeline Stages ──────────────────────────────────────────────────────────
const STAGES = [
  { key: "application_filled", label: "Application Filled", short: "Applied"   },
  { key: "online_test",        label: "Online Test",         short: "Test"      },
  { key: "result",             label: "Result",              short: "Result"    },
  { key: "interview",          label: "Interview",           short: "Interview" },
  { key: "offer_letter",       label: "Issue Offer Letter",  short: "Offer"     },
  { key: "joining",            label: "Joining",             short: "Joining"   },
];

const STAGE_COLORS = {
  application_filled: { bg: "#fef9c3", color: "#854d0e", bar: "#facc15", dot: "#d97706" },
  online_test:        { bg: "#eff6ff", color: "#1d4ed8", bar: "#60a5fa", dot: "#3b82f6" },
  result:             { bg: "#f0fdf4", color: "#15803d", bar: "#4ade80", dot: "#22c55e" },
  interview:          { bg: "#fdf4ff", color: "#7e22ce", bar: "#c084fc", dot: "#a855f7" },
  offer_letter:       { bg: "#fff7ed", color: "#c2410c", bar: "#fb923c", dot: "#f97316" },
  joining:            { bg: "#f0fdfa", color: "#0f766e", bar: "#2dd4bf", dot: "#14b8a6" },
};

const DEFAULT_STAGE = "application_filled";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Compact stage pill (for narrow table cells) ──────────────────────────────
const StagePill = ({ current }) => {
  const st  = STAGES.find((s) => s.key === current) || STAGES[0];
  const c   = STAGE_COLORS[current] || STAGE_COLORS[DEFAULT_STAGE];
  const idx = STAGES.findIndex((s) => s.key === current);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap", background: c.bg, color: c.color, border: `1px solid ${c.bar}`, display: "inline-block" }}>
        {st.short}
      </span>
      {/* mini progress dots */}
      <div style={{ display: "flex", gap: 3 }}>
        {STAGES.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 14 : 5, height: 5, borderRadius: 3, background: i < idx ? c.dot : i === idx ? c.dot : "#e2e8f0", transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
};

// ─── Full Stage Stepper (desktop drill-down) ──────────────────────────────────
const StageStepper = ({ current }) => {
  const currentIdx = STAGES.findIndex((s) => s.key === current);
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {STAGES.map((st, idx) => {
        const c      = STAGE_COLORS[st.key];
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={st.key} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: done || active ? c.dot : "#e2e8f0",
                border: active ? `2px solid ${c.color}` : done ? `2px solid ${c.dot}` : "2px solid #cbd5e1",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: done || active ? "#fff" : "#94a3b8", fontWeight: 700,
                boxShadow: active ? `0 0 0 3px ${c.bg}` : "none", flexShrink: 0,
              }}>
                {done ? "✓" : idx + 1}
              </div>
              <span style={{ fontSize: 8, whiteSpace: "nowrap", fontWeight: active ? 700 : 400, color: active ? c.color : done ? c.dot : "#94a3b8" }}>
                {st.short}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 1px", marginBottom: 14,
                background: done ? `linear-gradient(to right,${STAGE_COLORS[STAGES[idx].key].bar},${STAGE_COLORS[STAGES[idx+1].key].bar})` : "#e2e8f0",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Stage Dropdown ───────────────────────────────────────────────────────────
const StageDropdown = ({ applicant, onUpdated, onInterviewStage }) => {
  const [updating, setUpdating] = useState(false);
  const current = applicant.stage || DEFAULT_STAGE;
  const c       = STAGE_COLORS[current] || STAGE_COLORS[DEFAULT_STAGE];
  const token   = localStorage.getItem("adminToken");

  const handleChange = async (e) => {
    const newStage = e.target.value;
    if (newStage === "interview" && onInterviewStage) {
      onInterviewStage(applicant);
      return;
    }
    setUpdating(true);
    try {
      await axios.patch(
        `${BASE_API}/api/jobs-careers/applications/${applicant._id}/stage`,
        { stage: newStage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Stage updated!");
      onUpdated(applicant._id, newStage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <select value={current} onChange={handleChange} disabled={updating} style={{
      padding: "4px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.bar}`,
      cursor: updating ? "wait" : "pointer", outline: "none", minWidth: 90,
    }}>
      {STAGES.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
    </select>
  );
};

// ─── Test Result Badge ────────────────────────────────────────────────────────
const TestBadge = ({ a, onSendResult }) => {
  if (a.testScore != null) {
    const passed = a.testPassed;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", background: passed ? "#f0fdf4" : "#fff1f2", color: passed ? "#15803d" : "#be123c", border: `1px solid ${passed ? "#bbf7d0" : "#fecdd3"}` }}>
          {a.testScore}/20 {passed ? "✓" : "✗"}
        </span>
        {!a.resultEmailSent ? (
          <button onClick={() => onSendResult(a)} style={{ fontSize: 10, padding: "2px 7px", background: "#0077a3", color: "#fff", border: "none", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap" }}>
            📧 Send Result
          </button>
        ) : (
          <span style={{ fontSize: 10, color: "#94a3b8" }}>✓ Sent</span>
        )}
      </div>
    );
  }
  if (a.testToken) return <span style={{ fontSize: 11, color: "#f59e0b" }}>{a.testSubmittedAt ? "Grading…" : "⏳ Pending"}</span>;
  return <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>;
};

// ─── Interview Modal ──────────────────────────────────────────────────────────
const InterviewModal = ({ applicant, onClose, onSaved }) => {
  const [link, setLink]         = useState(applicant.interviewLink || "");
  const [datetime, setDatetime] = useState(
    applicant.interviewScheduled ? new Date(applicant.interviewScheduled).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("adminToken");

  const handleSave = async () => {
    if (!link.trim()) { toast.error("Please enter a Zoom/Meet link"); return; }
    setSaving(true);
    try {
      await axios.patch(
        `${BASE_API}/api/jobs-careers/applications/${applicant._id}/stage`,
        { stage: "interview", interviewLink: link, interviewScheduled: datetime || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Stage set to Interview — email sent if configured!");
      onSaved(applicant._id, link, datetime);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg,#4c1d95,#7e22ce)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Interview Setup</p>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "3px 0 0" }}>{applicant.fullName}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "12px 14px" }}>
            <p style={{ fontSize: 12, color: "#7e22ce", margin: "0 0 2px", fontWeight: 600 }}>📧 Auto Email (if configured)</p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.6 }}>An invitation email with the Zoom link will be sent to <strong>{applicant.email}</strong>.</p>
          </div>
          <div>
            <label style={ms.label}>Zoom / Google Meet Link *</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://zoom.us/j/..." style={ms.input} />
          </div>
          <div>
            <label style={ms.label}>Interview Date &amp; Time (optional)</label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} style={ms.input} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
            <button onClick={onClose} style={ms.cancelBtn}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={ms.saveBtn}>{saving ? "Saving…" : "Confirm Interview 🎥"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ms = {
  label:     { fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 },
  input:     { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box" },
  cancelBtn: { padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  saveBtn:   { padding: "9px 18px", border: "none", borderRadius: 8, background: "#7e22ce", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};

// ─── Result Email Modal ───────────────────────────────────────────────────────
const ResultEmailModal = ({ applicant, onClose, onSent }) => {
  const [sending, setSending] = useState(false);
  const token = localStorage.getItem("adminToken");

  const send = async (passed) => {
    setSending(true);
    try {
      await axios.post(
        `${BASE_API}/api/jobs-careers/applications/${applicant._id}/send-result-email`,
        { passed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${passed ? "Pass ✓" : "Fail ✗"} result email sent!`);
      onSent(applicant._id, passed);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send result email");
    } finally {
      setSending(false);
    }
  };

  const score  = applicant.testScore ?? "—";
  const pct    = applicant.testScore != null ? Math.round((applicant.testScore / 20) * 100) : null;
  const isPassing = pct != null && pct >= 60;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg,#064e3b,#15803d)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Send Test Result</p>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "3px 0 0" }}>{applicant.fullName}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 96, height: 96, borderRadius: "50%", border: `6px solid ${isPassing ? "#22c55e" : "#ef4444"}`, background: isPassing ? "#f0fdf4" : "#fff1f2" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: isPassing ? "#15803d" : "#be123c", margin: 0 }}>{score}/20</p>
              {pct != null && <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{pct}%</p>}
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
              {applicant.testSubmittedAt ? `Submitted: ${new Date(applicant.testSubmittedAt).toLocaleString("en-IN")}` : "Test not yet submitted"}
            </p>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.7 }}>
              Select Pass or Fail — a result email will be sent to <strong>{applicant.email}</strong>.
              {applicant.resultEmailSent && <span style={{ color: "#f59e0b", display: "block", marginTop: 3 }}>⚠ Already sent once.</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => send(false)} disabled={sending} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#be123c", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {sending ? "…" : "Send FAIL ✗"}
            </button>
            <button onClick={() => send(true)} disabled={sending} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {sending ? "…" : "Send PASS ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Applicant Card (mobile/tablet) ──────────────────────────────────────────
const ApplicantCard = ({ a, index, onUpdated, onInterviewStage, onSendResult, showPipeline = false }) => {
  const stKey = a.stage || DEFAULT_STAGE;
  const c     = STAGE_COLORS[stKey] || STAGE_COLORS[DEFAULT_STAGE];
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(to right,${c.bar},${c.dot})` }} />
      <div style={{ padding: "14px 16px" }}>
        {/* row 1: name + stage dropdown */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {index != null ? `${index + 1}. ` : ""}{a.fullName}
            </p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{a.city}{a.state ? `, ${a.state}` : ""}</p>
          </div>
          <StageDropdown applicant={a} onUpdated={onUpdated} onInterviewStage={onInterviewStage} />
        </div>

        {/* Pipeline progress */}
        {showPipeline && (
          <div style={{ marginBottom: 10 }}>
            <StageStepper current={stKey} />
          </div>
        )}

        {/* row 2: details grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginBottom: 10, fontSize: 12 }}>
          <div>
            <p style={{ color: "#94a3b8", margin: "0 0 1px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</p>
            <p style={{ color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</p>
          </div>
          <div>
            <p style={{ color: "#94a3b8", margin: "0 0 1px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Phone</p>
            <p style={{ color: "#374151", margin: 0 }}>{a.phone || "—"}</p>
          </div>
          {a.jobType && (
            <div>
              <p style={{ color: "#94a3b8", margin: "0 0 1px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Job Type</p>
              <span style={{ fontSize: 11, background: "#f5f3ff", color: "#6d28d9", padding: "1px 8px", borderRadius: 20, border: "1px solid #e9d5ff" }}>{a.jobType}</span>
            </div>
          )}
          <div>
            <p style={{ color: "#94a3b8", margin: "0 0 1px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Applied</p>
            <p style={{ color: "#374151", margin: 0 }}>{fmt(a.createdAt)}</p>
          </div>
        </div>

        {/* Test result */}
        {(a.testToken || a.testScore != null) && (
          <div style={{ paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
            <TestBadge a={a} onSendResult={onSendResult} />
          </div>
        )}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function JobsTracking() {
  const [jobs, setJobs]                     = useState([]);
  const [applications, setApplications]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedJob, setSelectedJob]       = useState(null);
  const [search, setSearch]                 = useState("");
  const [stageFilter, setStageFilter]       = useState("all");
  const [interviewModal, setInterviewModal] = useState(null);
  const [resultModal, setResultModal]       = useState(null);

  // ── ResizeObserver ─────────────────────────────────────────────────────────
  const containerRef = useRef(null);
  const [w, setW]    = useState(900);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    setW(containerRef.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  const isMobile  = w < 560;
  const isTablet  = w >= 560 && w < 880;
  const isDesktop = w >= 880;

  const token   = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        axios.get(`${BASE_API}/api/jobs-manage`, { headers }),
        axios.get(`${BASE_API}/api/jobs-careers/applications`, { headers }),
      ]);
      setJobs(jobsRes.data.jobs ?? []);
      setApplications(appsRes.data.data ?? []);
    } catch { toast.error("Failed to load tracking data"); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStageUpdate    = (id, stage)         => setApplications((p) => p.map((a) => a._id === id ? { ...a, stage }                                                                    : a));
  const handleInterviewStage = (applicant)          => setInterviewModal(applicant);
  const handleInterviewSaved = (id, link, dt)       => setApplications((p) => p.map((a) => a._id === id ? { ...a, stage: "interview", interviewLink: link, interviewScheduled: dt }          : a));
  const handleResultSent     = (id, passed)         => setApplications((p) => p.map((a) => a._id === id ? { ...a, testPassed: passed, testResult: passed?"pass":"fail", resultEmailSent: true }: a));

  // ── Derived ────────────────────────────────────────────────────────────────
  const grouped = jobs.map((job) => {
    const apps   = applications.filter((a) => a.applyingFor?.toLowerCase().trim() === job.title?.toLowerCase().trim());
    const counts = STAGES.reduce((acc, st) => { acc[st.key] = apps.filter((a) => (a.stage || DEFAULT_STAGE) === st.key).length; return acc; }, {});
    return { job, apps, counts, total: apps.length };
  });

  const knownTitles   = jobs.map((j) => j.title?.toLowerCase().trim());
  const uncategorized = applications.filter((a) => !knownTitles.includes(a.applyingFor?.toLowerCase().trim()));

  const filteredGrouped = grouped.filter((g) =>
    (!search || g.job.title?.toLowerCase().includes(search.toLowerCase()) || g.job.department?.toLowerCase().includes(search.toLowerCase())) &&
    (stageFilter === "all" || (g.counts[stageFilter] || 0) > 0)
  );

  const stageTotals = { total: applications.length, ...STAGES.reduce((acc, st) => { acc[st.key] = applications.filter((a) => (a.stage || DEFAULT_STAGE) === st.key).length; return acc; }, {}) };

  // ── Shared modals ──────────────────────────────────────────────────────────
  const modals = (
    <>
      {interviewModal && <InterviewModal applicant={interviewModal} onClose={() => setInterviewModal(null)} onSaved={(id, link, dt) => { handleInterviewSaved(id, link, dt); setInterviewModal(null); }} />}
      {resultModal    && <ResultEmailModal applicant={resultModal}  onClose={() => setResultModal(null)}    onSent={handleResultSent} />}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // DRILL-DOWN VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (selectedJob) {
    const { job } = selectedJob;
    const liveApps = applications.filter((a) => a.applyingFor?.toLowerCase().trim() === job.title?.toLowerCase().trim());

    return (
      <div ref={containerRef} style={s.page}>
        <Styles />

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setSelectedJob(null)} style={s.backBtn}>← Back to Tracking</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <div>
              <p style={s.pageLabel}>Jobs &amp; Careers Zone</p>
              <h1 style={{ ...s.pageTitle, fontSize: isMobile ? 17 : 22 }}>{job.title}</h1>
              <p style={s.pageSub}>{[job.department, job.jobType, job.location].filter(Boolean).join(" · ")}</p>
            </div>
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>{liveApps.length}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>applicant{liveApps.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* ── Stage mini-stats ────────────────────────────────────── */}
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, minWidth: 480 }}>
            {STAGES.map((st) => {
              const c = STAGE_COLORS[st.key];
              const count = liveApps.filter((a) => (a.stage || DEFAULT_STAGE) === st.key).length;
              return (
                <div key={st.key} style={{ flex: "1 0 70px", background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${c.bar}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: c.color, margin: 0 }}>{count}</p>
                  <p style={{ fontSize: 9, color: "#64748b", marginTop: 2, lineHeight: 1.3 }}>{st.short}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Pipeline bar chart ──────────────────────────────────── */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>Pipeline — {job.title}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 64 }}>
            {STAGES.map((st) => {
              const c     = STAGE_COLORS[st.key];
              const count = liveApps.filter((a) => (a.stage || DEFAULT_STAGE) === st.key).length;
              const pct   = liveApps.length > 0 ? (count / liveApps.length) * 100 : 0;
              return (
                <div key={st.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.color }}>{count}</span>
                  <div style={{ width: "100%", height: 44, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: `${Math.max(pct, 5)}%`, background: c.bar, borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                  </div>
                  <span style={{ fontSize: 8, color: "#94a3b8", whiteSpace: "nowrap" }}>{st.short}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Candidates list ─────────────────────────────────────── */}
        {liveApps.length === 0 ? (
          <div style={s.empty}>No applications for this position.</div>
        ) : isDesktop ? (
          /* Desktop: full table */
          <div style={s.tableWrap}>
            <table style={{ ...s.table, minWidth: 900 }}>
              <thead>
                <tr>{["#","Name","Email","Job Type","Pipeline","Test","Applied","Stage"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {liveApps.map((a, i) => {
                  const stKey = a.stage || DEFAULT_STAGE;
                  return (
                    <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ ...s.td, width: 36, color: "#94a3b8", fontSize: 12 }}>{i+1}</td>
                      <td style={s.td}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: 0 }}>{a.fullName}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{a.city}{a.state?`, ${a.state}`:""}</p>
                      </td>
                      <td style={s.td}>
                        <p style={{ fontSize: 12, margin: 0 }}>{a.email}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>{a.phone}</p>
                      </td>
                      <td style={s.td}>
                        {a.jobType
                          ? <span style={{ fontSize: 11, background: "#f5f3ff", color: "#6d28d9", padding: "2px 8px", borderRadius: 20, border: "1px solid #e9d5ff", whiteSpace: "nowrap" }}>{a.jobType}</span>
                          : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ ...s.td, minWidth: 280 }}><StageStepper current={stKey} /></td>
                      <td style={s.td}><TestBadge a={a} onSendResult={setResultModal} /></td>
                      <td style={{ ...s.td, whiteSpace: "nowrap", fontSize: 12, color: "#64748b" }}>{fmt(a.createdAt)}</td>
                      <td style={s.td}><StageDropdown applicant={a} onUpdated={handleStageUpdate} onInterviewStage={handleInterviewStage} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : isTablet ? (
          /* Tablet: compact table (no pipeline stepper, use pill) */
          <div style={s.tableWrap}>
            <table style={{ ...s.table, minWidth: 560 }}>
              <thead>
                <tr>{["#","Name","Stage","Test","Applied","Update"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {liveApps.map((a, i) => {
                  const stKey = a.stage || DEFAULT_STAGE;
                  return (
                    <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ ...s.td, width: 32, color: "#94a3b8", fontSize: 11 }}>{i+1}</td>
                      <td style={s.td}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: 0 }}>{a.fullName}</p>
                        <p style={{ fontSize: 11, color: "#64748b", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{a.email}</p>
                        {a.jobType && <span style={{ fontSize: 10, background: "#f5f3ff", color: "#6d28d9", padding: "1px 6px", borderRadius: 20, border: "1px solid #e9d5ff", marginTop: 2, display: "inline-block" }}>{a.jobType}</span>}
                      </td>
                      <td style={s.td}><StagePill current={stKey} /></td>
                      <td style={s.td}><TestBadge a={a} onSendResult={setResultModal} /></td>
                      <td style={{ ...s.td, whiteSpace: "nowrap", fontSize: 11, color: "#64748b" }}>{fmt(a.createdAt)}</td>
                      <td style={s.td}><StageDropdown applicant={a} onUpdated={handleStageUpdate} onInterviewStage={handleInterviewStage} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Mobile: cards */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {liveApps.map((a, i) => (
              <ApplicantCard key={a._id} a={a} index={i}
                onUpdated={handleStageUpdate}
                onInterviewStage={handleInterviewStage}
                onSendResult={setResultModal}
                showPipeline={false}
              />
            ))}
          </div>
        )}

        {modals}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div ref={containerRef} style={s.page}>
      <Styles />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
        <div>
          <p style={s.pageLabel}>Jobs &amp; Careers Zone</p>
          <h1 style={{ ...s.pageTitle, fontSize: isMobile ? 17 : 22 }}>Recruitment Tracking</h1>
          <p style={s.pageSub}>Pipeline overview across all active job postings</p>
        </div>
        <button onClick={fetchAll} style={s.refreshBtn}>↺ Refresh</button>
      </div>

      {/* ── Summary stats ────────────────────────────────────────── */}
      <div style={{ overflowX: isMobile ? "auto" : "visible", marginBottom: 20 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(7,minmax(68px,1fr))" : isTablet ? "repeat(7,1fr)" : "repeat(7,1fr)",
          gap: 8, minWidth: isMobile ? 490 : "auto",
        }}>
          <div style={{ ...s.statCard, borderTop: "3px solid #0077a3" }}>
            <p style={{ ...s.statNum, color: "#0077a3" }}>{stageTotals.total}</p>
            <p style={s.statLabel}>Total</p>
          </div>
          {STAGES.map((st) => {
            const c = STAGE_COLORS[st.key];
            return (
              <div key={st.key} style={{ ...s.statCard, borderTop: `3px solid ${c.bar}` }}>
                <p style={{ ...s.statNum, color: c.color }}>{stageTotals[st.key] || 0}</p>
                <p style={s.statLabel}>{st.short}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center", marginBottom: 18 }}>
        <input
          type="text" placeholder="Search by job title or department…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ ...s.searchInput, flex: 1 }}
        />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 12, color: "#374151", outline: "none", background: "#fff", flexShrink: 0 }}>
          <option value="all">All stages</option>
          {STAGES.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0, whiteSpace: "nowrap" }}>
          {filteredGrouped.length} position{filteredGrouped.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Job Cards ────────────────────────────────────────────── */}
      {loading ? (
        <div style={s.empty}>
          <div style={s.spinner} />
          <p style={{ marginTop: 12, color: "#94a3b8" }}>Loading tracking data…</p>
        </div>
      ) : filteredGrouped.length === 0 ? (
        <div style={s.empty}>No job postings found.</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(auto-fill,minmax(360px,1fr))",
          gap: 14,
        }}>
          {filteredGrouped.map(({ job, apps, counts, total }) => {
            const joining = counts.joining || 0;
            const offer   = counts.offer_letter || 0;
            const activeStageIdx = [...STAGES].reverse().findIndex((st) => apps.some((a) => (a.stage || DEFAULT_STAGE) === st.key));
            const highestActive  = activeStageIdx >= 0 ? STAGES[STAGES.length - 1 - activeStageIdx] : null;

            return (
              <div key={job._id} style={s.card}>
                {/* Card header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={s.cardAvatar}>{(job.department?.[0] || job.title?.[0] || "J").toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ ...s.cardTitle, fontSize: isMobile ? 13 : 15 }}>{job.title}</h3>
                      <p style={{ ...s.cardMeta, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {[job.department, job.location, job.jobType].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>{total}</p>
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>applicant{total !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Funnel bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                  {STAGES.map((st) => {
                    const count = counts[st.key] || 0;
                    const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                    const c     = STAGE_COLORS[st.key];
                    return (
                      <div key={st.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 10, color: "#64748b" }}>{st.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: c.color }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: c.bar, borderRadius: 4, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {STAGES.map((st) => {
                    const count = counts[st.key] || 0;
                    if (!count) return null;
                    const c = STAGE_COLORS[st.key];
                    return <span key={st.key} style={{ ...s.chip, background: c.bg, color: c.color }}>{count} {st.short}</span>;
                  })}
                  {total === 0 && <span style={{ fontSize: 11, color: "#94a3b8" }}>No applications yet</span>}
                </div>

                {highestActive && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>Latest stage:</span>
                    <span style={{ ...s.chip, background: STAGE_COLORS[highestActive.key].bg, color: STAGE_COLORS[highestActive.key].color }}>{highestActive.label}</span>
                  </div>
                )}

                {total > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {[`Joined: ${joining}`, `Offers: ${offer}`, `Posted: ${fmt(job.createdAt)}`].map((txt, i) => (
                      <span key={i} style={{ fontSize: 11, color: "#64748b", background: "#f8fafc", padding: "2px 7px", borderRadius: 6, border: "1px solid #e2e8f0" }}>{txt}</span>
                    ))}
                  </div>
                )}

                <button onClick={() => setSelectedJob({ job, apps })} style={s.viewBtn}>
                  View {total} Candidate{total !== 1 ? "s" : ""} →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Walk-in / Other ──────────────────────────────────────── */}
      {uncategorized.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Walk-in / Other ({uncategorized.length})
          </p>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {uncategorized.map((a, i) => (
                <ApplicantCard key={a._id} a={a} index={i}
                  onUpdated={handleStageUpdate}
                  onInterviewStage={handleInterviewStage}
                  onSendResult={setResultModal}
                />
              ))}
            </div>
          ) : isTablet ? (
            /* Tablet uncategorized table */
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{["Name","Applying For","Email","Applied","Stage"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {uncategorized.map((a, i) => (
                    <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={s.td}><p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: 0 }}>{a.fullName}</p></td>
                      <td style={s.td}><span style={s.roleChip}>{a.applyingFor}</span></td>
                      <td style={{ ...s.td, fontSize: 12 }}>{a.email}</td>
                      <td style={{ ...s.td, fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{fmt(a.createdAt)}</td>
                      <td style={s.td}><StageDropdown applicant={a} onUpdated={handleStageUpdate} onInterviewStage={handleInterviewStage} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Desktop uncategorized table */
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{["Name","Applying For","Job Type","Email","Applied On","Stage"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {uncategorized.map((a, i) => (
                    <tr key={a._id} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={s.td}><p style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", margin: 0 }}>{a.fullName}</p></td>
                      <td style={s.td}><span style={s.roleChip}>{a.applyingFor}</span></td>
                      <td style={s.td}><span style={{ fontSize: 11, background: "#f5f3ff", color: "#6d28d9", padding: "2px 8px", borderRadius: 20, border: "1px solid #e9d5ff" }}>{a.jobType || "—"}</span></td>
                      <td style={{ ...s.td, fontSize: 12 }}>{a.email}</td>
                      <td style={{ ...s.td, fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{fmt(a.createdAt)}</td>
                      <td style={s.td}><StageDropdown applicant={a} onUpdated={handleStageUpdate} onInterviewStage={handleInterviewStage} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modals}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    * { box-sizing: border-box; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin   { to{transform:rotate(360deg)} }
    button:not(:disabled):hover { opacity: 0.88; }
    select, input { font-family: inherit; }
  `}</style>
);

const s = {
  page:          { fontFamily: "'Inter','Segoe UI',sans-serif", padding: 0 },
  pageLabel:     { fontSize: 11, fontWeight: 600, color: "#0077a3", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" },
  pageTitle:     { fontWeight: 700, color: "#0f172a", margin: 0 },
  pageSub:       { fontSize: 12, color: "#64748b", marginTop: 3 },
  refreshBtn:    { padding: "7px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "#374151", background: "#fff", cursor: "pointer", flexShrink: 0 },
  backBtn:       { background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "#0077a3", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 },
  statCard:      { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 6px", textAlign: "center" },
  statNum:       { fontSize: 18, fontWeight: 700, margin: "0 0 3px" },
  statLabel:     { fontSize: 9, color: "#64748b", margin: 0, fontWeight: 500, lineHeight: 1.3, textTransform: "uppercase" },
  searchInput:   { padding: "9px 13px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none", width: "100%", background: "#fff" },
  card:          { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", animation: "fadeUp 0.35s ease both" },
  cardAvatar:    { width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#003d57,#0077a3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 },
  cardTitle:     { fontWeight: 700, color: "#0f172a", margin: "0 0 2px" },
  cardMeta:      { fontSize: 11, color: "#64748b", margin: 0 },
  chip:          { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" },
  viewBtn:       { padding: "9px 12px", background: "#f0f9ff", color: "#0077a3", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", marginTop: "auto" },
  tableWrap:     { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflowX: "auto" },
  table:         { width: "100%", borderCollapse: "collapse", minWidth: 500 },
  th:            { padding: "10px 12px", fontSize: 10, fontWeight: 600, color: "#64748b", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  tr:            { borderBottom: "1px solid #f1f5f9" },
  td:            { padding: "10px 12px", verticalAlign: "middle" },
  roleChip:      { fontSize: 11, fontWeight: 500, background: "#eff8fb", color: "#0077a3", padding: "2px 8px", borderRadius: 20, border: "1px solid #bae6fd", whiteSpace: "nowrap" },
  empty:         { textAlign: "center", padding: "48px 20px", color: "#94a3b8", fontSize: 14 },
  spinner:       { width: 32, height: 32, border: "3px solid #e2e8f0", borderTop: "3px solid #0077a3", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" },
};