import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
const TOTAL_Q   = 20;
const TIME_SECS = 30 * 60; 

export default function OnlineTest() {
  const { token } = useParams();
  const [phase, setPhase]       = useState("loading"); 
  const [meta, setMeta]         = useState(null);      
  const [answers, setAnswers]   = useState({});         
  const [current, setCurrent]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_SECS);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  // ── Load test ──────────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${BASE_API}/api/jobs-careers/test/${token}`)
      .then(r => { setMeta(r.data); setPhase("instructions"); })
      .catch(e => {
        const msg = e.response?.data?.message || "Invalid or expired test link.";
        setError(msg); setPhase("error");
      });
  }, [token]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pct = Math.round((timeLeft / TIME_SECS) * 100);
  const timerColor = timeLeft < 300 ? "#ef4444" : timeLeft < 600 ? "#f59e0b" : "#0077a3";

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (auto = false) => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    const payload = Object.entries(answers).map(([qi, sel]) => ({
      questionIndex: Number(qi), selected: sel,
    }));
    try {
      const r = await axios.post(`${BASE_API}/api/jobs-careers/test/${token}/submit`, { answers: payload });
      setResult(r.data);
      setPhase("submitted");
    } catch (e) {
      setError(e.response?.data?.message || "Submission failed. Please contact HR.");
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  };

  const answered    = Object.keys(answers).length;
  const unanswered  = TOTAL_Q - answered;
  const progress    = Math.round((answered / TOTAL_Q) * 100);
  const q           = meta?.questions?.[current];

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div style={s.page}><Style />
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={{ color: "#64748b", marginTop: 16 }}>Loading your test...</p>
      </div>
    </div>
  );

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (phase === "error") return (
    <div style={s.page}><Style />
      <div style={{ ...s.card, textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "#be123c", fontWeight: 700, margin: "0 0 12px" }}>Access Denied</h2>
        <p style={{ color: "#64748b", lineHeight: 1.7 }}>{error}</p>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 16 }}>
          If you believe this is an error, please contact us at{" "}
          <a href="mailto:careers@bioburgpharma.com" style={{ color: "#0077a3" }}>careers@bioburgpharma.com</a>
        </p>
      </div>
    </div>
  );

  // ── INSTRUCTIONS ───────────────────────────────────────────────────────────
  if (phase === "instructions") return (
    <div style={s.page}><Style />
      <div style={{ ...s.card, maxWidth: 640 }}>
        <div style={s.header}>
          <p style={s.brand}>BioBurg Pharma · Careers Portal</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "6px 0 4px" }}>Online Assessment</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            {meta.role} — Welcome, <strong>{meta.applicantName}</strong>
          </p>
        </div>

        <div style={{ padding: "28px 32px" }}>
          <div style={s.infoGrid}>
            {[
              ["📝","Questions","20 Multiple Choice"],
              ["⏱","Time Limit","30 Minutes"],
              ["✅","Passing Score","12 / 20 (60%)"],
              ["⚡","Attempts","One attempt only"],
            ].map(([icon, label, val]) => (
              <div key={label} style={s.infoCard}>
                <p style={{ fontSize: 22, margin: "0 0 6px" }}>{icon}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "3px 0 0" }}>{val}</p>
              </div>
            ))}
          </div>

          <div style={s.instructions}>
            <p style={{ fontWeight: 700, color: "#0f172a", margin: "0 0 10px", fontSize: 14 }}>📋 Instructions</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 2.2 }}>
              <li>Each question has 4 options — select the <strong>one best answer</strong>.</li>
              <li>You can navigate between questions using the <strong>question grid</strong> on the right.</li>
              <li>The test will <strong>auto-submit</strong> when the timer reaches 0.</li>
              <li>Do not refresh or close the browser — your test will be lost.</li>
              <li>Ensure a <strong>stable internet connection</strong> before starting.</li>
              <li>Results will be shared with you via email after admin review.</li>
            </ul>
          </div>

          <button onClick={() => setPhase("test")} style={s.startBtn}>
            Start Test →
          </button>
        </div>
      </div>
    </div>
  );

  // ── TEST ───────────────────────────────────────────────────────────────────
  if (phase === "test") return (
    <div style={s.page}><Style />
      <div style={s.testLayout}>

        {/* Left — Question panel */}
        <div style={s.questionPanel}>
          {/* Top bar */}
          <div style={s.topBar}>
            <div>
              <p style={s.brand}>BioBurg Pharma Assessment</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Q {current + 1} of {TOTAL_Q}</p>
            </div>
            {/* Timer */}
            <div style={{ textAlign: "center" }}>
              <div style={{ ...s.timerCircle, borderColor: timerColor }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: timerColor }}>{fmt(timeLeft)}</span>
              </div>
            </div>
            {/* Progress */}
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>Answered: <strong>{answered}/{TOTAL_Q}</strong></p>
              <div style={{ width: 100, height: 6, background: "#e2e8f0", borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "#0077a3", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>
          </div>

          {/* Question */}
          <div style={s.qBody}>
            <div style={s.qNumber}>Q{current + 1}</div>
            <h2 style={s.qText}>{q?.q}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
              {q?.options.map((opt, i) => {
                const selected = answers[current] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers(prev => ({ ...prev, [current]: i }))}
                    style={{
                      ...s.optBtn,
                      background: selected ? "#eff8fb" : "#fff",
                      border: selected ? "2px solid #0077a3" : "2px solid #e2e8f0",
                      color: selected ? "#0077a3" : "#374151",
                    }}
                  >
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: selected ? "#0077a3" : "#f1f5f9",
                      color: selected ? "#fff" : "#94a3b8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 12 }}>
              <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0} style={s.navBtn}>
                ← Previous
              </button>
              {current < TOTAL_Q - 1 ? (
                <button onClick={() => setCurrent(c => Math.min(TOTAL_Q-1, c+1))} style={{ ...s.navBtn, background: "#0077a3", color: "#fff", border: "none" }}>
                  Next →
                </button>
              ) : (
                <button onClick={() => handleSubmit(false)} disabled={submitting} style={{ ...s.navBtn, background: "#15803d", color: "#fff", border: "none", padding: "10px 24px" }}>
                  {submitting ? "Submitting..." : "Submit Test ✓"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right — Question grid + submit */}
        <div style={s.sidebar}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Question Navigator
          </p>
          <div style={s.qGrid}>
            {Array.from({ length: TOTAL_Q }).map((_, i) => {
              const isAnswered = answers[i] !== undefined;
              const isCurrent  = i === current;
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: 36, height: 36, borderRadius: 6, border: "none",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: isCurrent ? "#0077a3" : isAnswered ? "#dcfce7" : "#f1f5f9",
                    color: isCurrent ? "#fff" : isAnswered ? "#15803d" : "#64748b",
                    outline: isCurrent ? "2px solid #bae6fd" : "none",
                    outlineOffset: 2,
                    transition: "all 0.15s",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { color: "#0077a3", bg: "#0077a3", label: "Current" },
              { color: "#15803d", bg: "#dcfce7", label: "Answered" },
              { color: "#94a3b8", bg: "#f1f5f9", label: "Not Answered" },
            ].map(({ color, bg, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: bg, border: `1px solid ${color}` }} />
                {label}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: "12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>
              {unanswered > 0
                ? <span style={{ color: "#f59e0b" }}>⚠ {unanswered} question{unanswered !== 1 ? "s" : ""} unanswered</span>
                : <span style={{ color: "#15803d" }}>✅ All questions answered!</span>
              }
            </p>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{ ...s.navBtn, width: "100%", background: "#15803d", color: "#fff", border: "none", justifyContent: "center" }}
            >
              {submitting ? "Submitting..." : "Submit Test ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── SUBMITTED ──────────────────────────────────────────────────────────────
  if (phase === "submitted" && result) return (
    <div style={s.page}><Style />
      <div style={{ ...s.card, maxWidth: 520, textAlign: "center" }}>
        <div style={s.header}>
          <p style={s.brand}>BioBurg Pharma · Assessment Result</p>
        </div>
        <div style={{ padding: "32px" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>
            {result.passed ? "🎉" : "📋"}
          </div>
          <h2 style={{ fontWeight: 700, color: result.passed ? "#15803d" : "#be123c", fontSize: 22, margin: "0 0 8px" }}>
            {result.passed ? "Congratulations!" : "Assessment Complete"}
          </h2>

          {/* Score ring */}
          <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
            <div style={{
              width: 140, height: 140, borderRadius: "50%",
              border: `8px solid ${result.passed ? "#22c55e" : "#ef4444"}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: result.passed ? "#f0fdf4" : "#fff1f2",
            }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: result.passed ? "#15803d" : "#be123c", margin: 0 }}>
                {result.score}/{result.total}
              </p>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{result.percentage}%</p>
            </div>
          </div>

          <div style={{
            background: result.passed ? "#f0fdf4" : "#fff1f2",
            border: `1px solid ${result.passed ? "#bbf7d0" : "#fecdd3"}`,
            borderRadius: 10, padding: "14px 20px", marginBottom: 20,
          }}>
            <p style={{ fontSize: 14, color: result.passed ? "#15803d" : "#be123c", margin: 0, lineHeight: 1.7 }}>
              {result.message}
            </p>
          </div>

          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            Your result has been recorded. You will receive a confirmation email shortly.
            If you have questions, contact us at{" "}
            <a href="mailto:careers@bioburgpharma.com" style={{ color: "#0077a3" }}>careers@bioburgpharma.com</a>
          </p>
        </div>
      </div>
    </div>
  );

  return null;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const Style = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f1f4f8; font-family: 'Inter','Segoe UI',sans-serif; }
    @keyframes spin { to { transform: rotate(360deg); } }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    button { transition: all 0.15s ease; }
    button:hover:not(:disabled) { transform: translateY(-1px); }
  `}</style>
);

const s = {
  page:         { minHeight: "100vh", background: "#f1f4f8", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", fontFamily: "'Inter','Segoe UI',sans-serif" },
  center:       { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" },
  card:         { background: "#fff", borderRadius: 14, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", overflow: "hidden", width: "100%" },
  header:       { background: "linear-gradient(135deg,#003d57,#0077a3)", padding: "22px 32px" },
  brand:        { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" },
  infoGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  infoCard:     { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", textAlign: "center" },
  instructions: { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "16px 20px", marginBottom: 24 },
  startBtn:     { width: "100%", padding: "13px", background: "#0077a3", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  spinner:      { width: 40, height: 40, border: "3px solid #e2e8f0", borderTop: "3px solid #0077a3", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  // Test layout
  testLayout:   { display: "flex", gap: 20, width: "100%", maxWidth: 1100, alignItems: "flex-start" },
  questionPanel:{ flex: 1, background: "#fff", borderRadius: 14, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", overflow: "hidden", minWidth: 0 },
  sidebar:      { width: 220, background: "#fff", borderRadius: 14, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", padding: 20, flexShrink: 0 },
  topBar:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" },
  timerCircle:  { width: 70, height: 70, borderRadius: "50%", border: "4px solid #0077a3", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" },
  qBody:        { padding: "28px 32px" },
  qNumber:      { display: "inline-block", fontSize: 11, fontWeight: 700, color: "#0077a3", background: "#eff8fb", border: "1px solid #bae6fd", padding: "3px 12px", borderRadius: 20, marginBottom: 14, letterSpacing: "0.05em" },
  qText:        { fontSize: 17, fontWeight: 600, color: "#0f172a", lineHeight: 1.6, margin: 0 },
  optBtn:       { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, textAlign: "left", transition: "all 0.15s" },
  navBtn:       { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#f8fafc", color: "#374151" },
  qGrid:        { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 },
};