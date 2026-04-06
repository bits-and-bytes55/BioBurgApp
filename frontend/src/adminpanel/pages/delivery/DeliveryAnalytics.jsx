import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const BASE = import.meta.env.VITE_API_BASE_URL;
const api  = (url) => axios.get(`${BASE}${url}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
});

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#94a3b8"];
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ── Stat card ─────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, emoji }) {
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${color}25`, borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -14, right: -14, width: 72, height: 72, borderRadius: "50%", background: `${color}12` }} />
      <div style={{ fontSize: 26, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: "-.5px", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ── Section card ──────────────────────────────────────────── */
function Card({ title, icon, children, style = {} }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 16, padding: "20px 22px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 14, color: "#0f172a", letterSpacing: "-.2px" }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

/* ── Custom tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", border: "none", borderRadius: 10, padding: "10px 14px", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
      <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>{p.name}: </span>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>
            {p.name?.includes("Revenue") || p.name?.includes("₹") ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DeliveryAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/delivery/admin/analytics")
      .then(r => r.data.success && setData(r.data.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 12 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading analytics…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { daily = [], statusBreakdown = [], topAgents = [], totals = {} } = data || {};
  const statusPieData = statusBreakdown.map(s => ({ name: s._id, value: s.count }));


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .an-wrap *{box-sizing:border-box}
        .an-wrap{font-family:'DM Sans',sans-serif;color:#0f172a}
        .an-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px}
        .an-grid-5-3{display:grid;grid-template-columns:5fr 3fr;gap:18px;margin-bottom:18px}
        .an-grid-6-4{display:grid;grid-template-columns:6fr 4fr;gap:18px;margin-bottom:18px}
        .an-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media(max-width:1100px){
          .an-grid-4{grid-template-columns:repeat(2,1fr)}
          .an-grid-5-3,.an-grid-6-4{grid-template-columns:1fr}
          .an-grid-2{grid-template-columns:1fr}
        }
        @media(max-width:600px){
          .an-grid-4{grid-template-columns:repeat(2,1fr);gap:10px}
        }
      `}</style>

      <div className="an-wrap">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.4px" }}>Delivery Analytics</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>30-day performance overview</div>
        </div>



        {/* Daily orders chart + Status pie */}
        <div className="an-grid-5-3">
          <Card title="Daily Orders — Last 30 Days">
            {daily.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}></div>
                <div style={{ fontWeight: 700 }}>No order data yet</div>
                <div style={{ fontSize: 12, marginTop: 5 }}>Assign orders to agents to see trends</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={daily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="orders"    stroke="#6366f1" strokeWidth={2.5} dot={false} name="Assigned" />
                  <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2.5} dot={false} name="Delivered" />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Status Breakdown">
            {statusPieData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 13 }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="45%" outerRadius={80} innerRadius={40}
                    dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Revenue bar + Top agents */}
        <div className="an-grid-6-4">
          <Card title="Daily Revenue — Last 30 Days">
            {daily.length === 0 ? (
              <div style={{ textAlign: "center", padding: "52px 0", color: "#94a3b8", fontSize: 13 }}>No revenue data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={daily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[5, 5, 0, 0]} name="Revenue ₹" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Top Performing Agents" icon="🏆">
            {topAgents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏅</div>
                <div>No agent data yet</div>
              </div>
            ) : topAgents.map((a, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const medal  = medals[i] || `#${i + 1}`;
              const rowBg  = i === 0 ? "#fef9c3" : i === 1 ? "#f8fafc" : "transparent";
              return (
                <div key={a._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: rowBg, marginBottom: 6 }}>
                  <div style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>{medal}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{a.totalDeliveries} deliveries · {a.commission ?? 7}% commission</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: "#10b981" }}>{fmt(a.totalEarnings)}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>earned</div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Delivery rate progress */}
        {topAgents.length > 0 && (
          <Card title="Agent Performance Comparison" icon="⚡">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
              {topAgents.map(a => {
                const rate = a.totalDeliveries > 0 ? Math.min(100, a.totalDeliveries * 10) : 0; // visual only
                return (
                  <div key={a._id} style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>{a.name?.split(" ")[0]}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{a.totalDeliveries} deliveries · {fmt(a.totalEarnings)}</div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${rate}%`, background: "linear-gradient(90deg,#0d9488,#06b6d4)", borderRadius: 99, transition: "width 1s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>Paid: {fmt(a.paidEarnings || 0)}</span>
                      <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>
                        Due: {fmt((a.totalEarnings || 0) - (a.paidEarnings || 0))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}