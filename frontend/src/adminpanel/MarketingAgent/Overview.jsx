import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config/api";
const BASE = `${API_BASE_URL}/api`;

const getToken = () => localStorage.getItem("adminToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const AV_PALETTE = [
  { bg: "#9FE1CB", text: "#085041" },
  { bg: "#CECBF6", text: "#3C3489" },
  { bg: "#FAC775", text: "#633806" },
  { bg: "#B5D4F4", text: "#0C447C" },
  { bg: "#F5C4B3", text: "#712B13" },
  { bg: "#F4C0D1", text: "#72243E" },
];
const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AV_PALETTE[h % AV_PALETTE.length];
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const DOT_COLOR = { green: "#639922", amber: "#BA7517", blue: "#378ADD", red: "#A32D2D" };

function Avatar({ name, size = 36 }) {
  const av = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: av.bg, color: av.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size > 40 ? 15 : 12, fontWeight: 500, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function Badge({ children, variant = "neutral" }) {
  const map = {
    green:   { bg: "#EAF3DE", color: "#3B6D11" },
    red:     { bg: "#FCEBEB", color: "#A32D2D" },
    amber:   { bg: "#FAEEDA", color: "#854F0B" },
    blue:    { bg: "#E6F1FB", color: "#185FA5" },
    neutral: { bg: "#F1EFE8", color: "#5F5E5A" },
  };
  const s = map[variant] || map.neutral;
  return (
    <span style={{
      display: "inline-flex", padding: "2px 8px", borderRadius: 6,
      fontSize: 11, fontWeight: 500, background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function SkeletonBox({ h = 16, w = "100%" }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: "var(--color-background-secondary)",
      animation: "skpulse 1.4s ease infinite",
    }} />
  );
}

const card = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
  padding: "1.25rem",
};
const secTitle = {
  fontSize: 11, fontWeight: 500, textTransform: "uppercase",
  letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "1rem",
};

export default function Overview() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${BASE}/admin/marketing-agents`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`${res.status} — ${res.statusText}`);
      const data = await res.json();
      setAgents(data.agents || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // ── Derived numbers ──────────────────────────────────────────────────────────
  const total      = agents.length;
  const approved   = agents.filter((a) => a.isApproved).length;
  const onJob      = agents.filter((a) => a.isOnJob).length;
  const pending    = agents.filter((a) => !a.isApproved).length;
  const gpsBlocked = agents.filter((a) => a.isGpsBlocked).length;

  // ── Area breakdown ────────────────────────────────────────────────────────────
  const areaCounts = agents.reduce((acc, a) => {
    const area = a.assignedArea || "Unknown";
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});
  const areaMax  = Math.max(...Object.values(areaCounts), 1);
  const areaList = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const AREA_COLORS = ["#1D9E75", "#7F77DD", "#EF9F27", "#378ADD", "#D85A30"];

  // ── Agent subsets ─────────────────────────────────────────────────────────────
  const onJobAgents = agents.filter((a) => a.isOnJob).slice(0, 5);
  const idleApproved = agents.filter((a) => a.isApproved && !a.isOnJob).slice(0, 3);
  const activeList = [...onJobAgents, ...idleApproved].slice(0, 5);

  // ── Activity feed synthesised from real data ──────────────────────────────────
  const activity = [
    ...agents.filter((a) => a.isOnJob).slice(0, 2).map((a) => ({
      type: "green",
      text: `${a.name} is currently on job${a.assignedArea ? ` in ${a.assignedArea}` : ""}`,
      time: "Active now",
    })),
    ...agents.filter((a) => !a.isApproved)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2)
      .map((a) => ({
        type: "blue",
        text: `New agent registered — ${a.name}${a.assignedArea ? ` (${a.assignedArea})` : ""}. Awaiting admin approval`,
        time: fmtDate(a.createdAt),
      })),
    ...agents.filter((a) => a.gpsViolationCount >= 2 && !a.isGpsBlocked).slice(0, 1).map((a) => ({
      type: "amber",
      text: `${a.name} has ${a.gpsViolationCount} GPS violation${a.gpsViolationCount > 1 ? "s" : ""} — ${3 - a.gpsViolationCount} more will trigger a block`,
      time: "Recent",
    })),
    ...agents.filter((a) => a.isGpsBlocked).slice(0, 1).map((a) => ({
      type: "red",
      text: `${a.name} is GPS blocked after ${a.gpsViolationCount} violations`,
      time: "Recent",
    })),
  ].slice(0, 6);

  // ── Render skeleton ───────────────────────────────────────────────────────────
  const renderSkeleton = () => (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 12, marginBottom: "2rem" }}>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
            <SkeletonBox h={10} w="60%" />
            <div style={{ marginTop: 8 }}><SkeletonBox h={26} w="40%" /></div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {[220, 180].map((h, i) => (
          <div key={i} style={{ ...card }}><SkeletonBox h={h} /></div>
        ))}
      </div>
      <div style={card}><SkeletonBox h={160} /></div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? "1rem 0" : "2rem 0", fontFamily: "var(--font-sans,sans-serif)", color: "var(--color-text-primary)" }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:.7}50%{opacity:.3}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 4 }}>
            Marketing Zone
          </div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 500 }}>Overview</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastUpdated && !loading && (
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
              Updated {fmtTime(lastUpdated)}
            </div>
          )}
          <button
            onClick={fetchAgents}
            disabled={loading}
            style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
              background: "none", border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)", color: "var(--color-text-primary)", opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          marginBottom: "1.5rem", padding: "12px 1.25rem", borderRadius: "var(--border-radius-md)",
          background: "#FCEBEB", border: "0.5px solid #F7C1C1", fontSize: 13, color: "#A32D2D",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>Failed to load: {error}</span>
          <span style={{ cursor: "pointer", fontWeight: 500 }} onClick={fetchAgents}>Retry →</span>
        </div>
      )}

      {/* ── Pending banner ── */}
      {!loading && pending > 0 && (
        <div style={{
          marginBottom: "1.5rem", padding: "10px 1.25rem", borderRadius: "var(--border-radius-md)",
          background: "#FAEEDA", border: "0.5px solid #FAC775", fontSize: 13, color: "#633806",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>{pending} agent{pending > 1 ? "s" : ""} waiting for approval — they cannot log in.</span>
          <span style={{ fontWeight: 500 }}>Go to All Agents →</span>
        </div>
      )}

      {loading ? renderSkeleton() : (
        <>
          {/* ── Stats ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)",
            gap: 12, marginBottom: "2rem",
          }}>
            {[
              { label: "Total Agents",   value: total,      sub: `${approved} approved`,       subColor: "#3B6D11" },
              { label: "On Job Now",     value: onJob,      sub: "Active in field",             subColor: "#185FA5" },
              { label: "Approved",       value: approved,   sub: "Can log in",                  subColor: "#3B6D11" },
              { label: "Pending",        value: pending,    sub: "Need review",                 subColor: "#A32D2D" },
              { label: "GPS Blocked",    value: gpsBlocked, sub: "Login restricted",            subColor: "#A32D2D" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 500, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.subColor, marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Two columns ── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>

            {/* Active / on-job agents */}
            <div style={card}>
              <div style={secTitle}>Active Agents</div>
              {activeList.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "1rem 0" }}>No agents active right now.</div>
              ) : (
                activeList.map((agent, i) => (
                  <div key={agent._id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 0",
                    borderBottom: i < activeList.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                  }}>
                    <Avatar name={agent.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        {agent.assignedArea || "—"} · {agent.phone || "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <Badge variant={agent.isOnJob ? "green" : "neutral"}>
                        {agent.isOnJob ? "On Job" : "Available"}
                      </Badge>
                      {agent.isGpsBlocked && (
                        <div style={{ marginTop: 3 }}>
                          <Badge variant="red">GPS Blocked</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {agents.filter((a) => a.isApproved).length > 5 && (
                <div style={{ paddingTop: 10, textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)", cursor: "pointer" }}>
                  +{agents.filter((a) => a.isApproved).length - 5} more approved agents
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Area coverage */}
              <div style={card}>
                <div style={secTitle}>Area Coverage</div>
                {areaList.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No area data yet.</div>
                ) : (
                  areaList.map(([area, count], idx) => (
                    <div key={area} style={{ marginBottom: idx < areaList.length - 1 ? 12 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>{area}</span>
                        <span style={{ fontWeight: 500 }}>{count} agent{count > 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((count / areaMax) * 100)}%`, background: AREA_COLORS[idx % AREA_COLORS.length], borderRadius: 2 }} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* GPS & approval breakdown */}
              <div style={card}>
                <div style={secTitle}>Agent Status Breakdown</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Approved",     value: approved,   color: "#3B6D11", bg: "#EAF3DE" },
                    { label: "Pending",      value: pending,    color: "#854F0B", bg: "#FAEEDA" },
                    { label: "On Job",       value: onJob,      color: "#185FA5", bg: "#E6F1FB" },
                    { label: "GPS Blocked",  value: gpsBlocked, color: "#A32D2D", bg: "#FCEBEB" },
                  ].map((p) => (
                    <div key={p.label} style={{ textAlign: "center", background: p.bg, borderRadius: "var(--border-radius-md)", padding: "12px 8px" }}>
                      <div style={{ fontSize: 22, fontWeight: 500, color: p.color }}>{p.value}</div>
                      <div style={{ fontSize: 11, color: p.color, marginTop: 2, opacity: 0.8 }}>{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Pending agents list ── */}
          {pending > 0 && (
            <div style={{ ...card, marginBottom: "2rem" }}>
              <div style={secTitle}>Awaiting Approval</div>
              {agents.filter((a) => !a.isApproved)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map((agent, i, arr) => (
                  <div key={agent._id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 0",
                    borderBottom: i < arr.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                    flexWrap: "wrap",
                  }}>
                    <Avatar name={agent.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{agent.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        {agent.assignedArea || "—"} · {agent.email}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Registered {fmtDate(agent.createdAt)}</span>
                      <Badge variant="amber">Pending</Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── GPS violators ── */}
          {agents.filter((a) => a.gpsViolationCount > 0).length > 0 && (
            <div style={{ ...card, marginBottom: "2rem" }}>
              <div style={secTitle}>GPS Violations</div>
              {agents.filter((a) => a.gpsViolationCount > 0)
                .sort((a, b) => b.gpsViolationCount - a.gpsViolationCount)
                .slice(0, 5)
                .map((agent, i, arr) => (
                  <div key={agent._id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 0",
                    borderBottom: i < arr.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                    flexWrap: "wrap",
                  }}>
                    <Avatar name={agent.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{agent.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{agent.assignedArea || "—"}</div>
                    </div>
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge variant={agent.isGpsBlocked ? "red" : "amber"}>
                        {agent.isGpsBlocked ? "GPS Blocked" : `${agent.gpsViolationCount} strike${agent.gpsViolationCount > 1 ? "s" : ""}`}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── Activity feed ── */}
          <div style={card}>
            <div style={secTitle}>Live Activity Feed</div>
            {activity.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "0.5rem 0" }}>
                No recent activity. Agents may not have started jobs yet.
              </div>
            ) : (
              activity.map((a, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: "10px 0",
                  borderBottom: i < activity.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: DOT_COLOR[a.type] || "#888", marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Empty state ── */}
          {total === 0 && !error && (
            <div style={{ ...card, textAlign: "center", padding: "3rem", marginTop: "2rem" }}>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No agents registered yet</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                When marketing agents register, they will appear here for approval and tracking.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}