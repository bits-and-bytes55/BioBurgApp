import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_API, C, GS } from "./_pharmacySharedUtils";
import { PageHeader, SearchBar, RejectModal, DetailModal, PharmacyTable } from "./_pharmacyShared";

function StatCard({ label, value, borderColor, sub }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, padding:"22px 24px", border:`1px solid ${C.border}`, borderTop:`3px solid ${borderColor}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", flex:1, minWidth:140 }}>
      <div style={{ fontSize:34, fontWeight:800, color:"#0f172a", letterSpacing:"-1.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11.5, color:"#94a3b8", marginTop:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:C.slate, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function DonutChart({ segments, total }) {
  const r = 42, cx = 60, cy = 60, stroke = 15, circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.filter(s => s.value > 0).map(s => {
    const dash = (s.value / (total || 1)) * circ;
    const arc = { ...s, dash, gap: circ - dash, offset };
    offset += dash;
    return arc;
  });
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color}
          strokeWidth={stroke} strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={-a.offset + circ * 0.25} strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={8.5} fill={C.muted} fontFamily="inherit">Total</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={24} fontWeight="800" fill={C.text} fontFamily="inherit">{total}</text>
    </svg>
  );
}

function BarChart({ data, color }) {
  if (!data || data.length === 0) return <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:12 }}>No registration data yet</div>;
  const max = Math.max(...data.map(d => d.value), 1), w = 100 / data.length;
  return (
    <svg width="100%" height={100} viewBox="0 0 100 100" preserveAspectRatio="none">
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / max) * 72), x = i * w + w * 0.18;
        return (
          <g key={i}>
            <rect x={`${x}%`} y={72 - barH} width={`${w * 0.64}%`} height={barH} fill={color} rx={2} opacity={0.82} />
            {d.value > 0 && <text x={`${i * w + w / 2}%`} y={68 - barH} textAnchor="middle" fontSize={6} fill={color} fontFamily="inherit" fontWeight="700">{d.value}</text>}
            <text x={`${i * w + w / 2}%`} y={84} textAnchor="middle" fontSize={6} fill={C.muted} fontFamily="inherit">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PharmacyOverview() {
  const [pharmacies, setPharmacies] = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastSync,   setLastSync]   = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const token = localStorage.getItem("adminToken");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [phRes, ordRes] = await Promise.allSettled([
        axios.get(`${BASE_API}/api/pharmacy/all`,    { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_API}/api/hospital/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (phRes.status === "fulfilled") {
        setPharmacies(phRes.value.data.pharmacies || []);
        setLastSync(new Date());
      }
      if (ordRes.status === "fulfilled") {
        const payload = ordRes.value.data;
        setOrders(Array.isArray(payload) ? payload : (payload.orders || []));
      }
    } catch { if (!silent) toast.error("Failed to load pharmacies"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(() => fetchData(true), 30000); return () => clearInterval(iv); }, [fetchData]);

  const handleApprove = async (id, name) => {
    setActionLoading(id);
    try {
      await axios.patch(`${BASE_API}/api/pharmacy/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${name} approved`); fetchData(true);
    } catch(err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };
  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return; setActionLoading(rejectTarget._id);
    try {
      await axios.patch(`${BASE_API}/api/pharmacy/reject/${rejectTarget._id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${rejectTarget.facilityName} rejected`); setRejectTarget(null); fetchData(true);
    } catch(err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };

  const approved = pharmacies.filter(p => p.status === "approved");
  const pending  = pharmacies.filter(p => p.status === "pending");
  const rejected = pharmacies.filter(p => p.status === "rejected");

  // Orders stats
  const totalOrderRevenue = orders.filter(o=>o.orderStatus==="DELIVERED").reduce((a,o)=>a+(o.totalAmount||0),0);
  const pendingOrders     = orders.filter(o=>["PLACED","CONFIRMED","PROCESSING"].includes(o.orderStatus)).length;

  // Monthly registrations
  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); monthlyMap[d.toLocaleString("en-IN", { month: "short" })] = 0; }
  pharmacies.forEach(p => { if (!p.createdAt) return; const k = new Date(p.createdAt).toLocaleString("en-IN", { month: "short" }); if (monthlyMap[k] !== undefined) monthlyMap[k]++; });
  const monthlyData = Object.entries(monthlyMap).map(([label, value]) => ({ label, value }));

  // State breakdown
  const byState = {};
  pharmacies.forEach(p => { if (p.state) byState[p.state] = (byState[p.state] || 0) + 1; });
  const stateRows  = Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSt      = Math.max(...stateRows.map(([, v]) => v), 1);
  const stateColors = [C.primary, "#7c3aed", "#0077a3", C.amber, C.rose, "#0891b2"];

  // Facility types
  const byType = {};
  pharmacies.forEach(p => { const t = p.facilityType || "Pharmacy"; byType[t] = (byType[t] || 0) + 1; });
  const typeRows = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 4);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, padding:"80px 0" }}>
      <style>{GS}</style>
      <div style={{ width:36, height:36, border:`3px solid ${C.border2}`, borderTopColor:C.primary, borderRadius:"50%", animation:"ph-spin 0.9s linear infinite" }} />
      <div style={{ fontSize:13, color:C.muted }}>Loading pharmacy data...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{GS}</style>
      <PageHeader title="Pharmacy Zone — Overview" sub="Live analytics across all registered pharmacies" lastSync={lastSync} onRefresh={() => fetchData()} />

      {/* ── KPI row — No "Most Common Type", replaced with Orders ── */}
      <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
        <StatCard label="Total Pharmacies"   value={pharmacies.length} borderColor={C.primary} sub="registered on platform" />
        <StatCard label="Pending Review"     value={pending.length}    borderColor={C.amber}   sub="awaiting admin action" />
        <StatCard label="Approved & Active"  value={approved.length}   borderColor={C.green}   sub="live on platform" />
        <StatCard label="Rejected"           value={rejected.length}   borderColor={C.rose}    sub="access blocked" />
        <StatCard label="Platform Orders"    value={orders.length}     borderColor="#7c3aed"   sub={`₹${totalOrderRevenue.toLocaleString("en-IN")} revenue`} />
        <StatCard label="Orders Pending"     value={pendingOrders}     borderColor={C.amber}   sub="awaiting fulfilment" />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 1fr", gap:16, marginBottom:22 }}>
        {/* Donut */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em" }}>Status Split</div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <DonutChart total={pharmacies.length} segments={[{value:approved.length,color:C.green},{value:pending.length,color:C.amber},{value:rejected.length,color:C.rose}]} />
            <div style={{ width:"100%" }}>
              {[["Approved", approved.length, C.green], ["Pending", pending.length, C.amber], ["Rejected", rejected.length, C.rose]].map(([l, v, c]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0 }} />
                  <span style={{ fontSize:12, color:C.slate, flex:1 }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Bar — monthly registrations */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>New Registrations</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>Last 6 months — live data</div>
          <BarChart data={monthlyData} color={C.primary} />
        </div>
        {/* State spread */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Geographic Spread</div>
          {stateRows.length === 0 ? <div style={{ color:C.muted, fontSize:13 }}>No state data yet</div>
            : stateRows.map(([state, count], i) => (
              <div key={state} style={{ marginBottom:11 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:4 }}>
                  <span style={{ color:C.text, fontWeight:600 }}>{state}</span>
                  <span style={{ color:stateColors[i % 6], fontWeight:800 }}>{count}</span>
                </div>
                <div style={{ height:5, background:"#f1f5f9", borderRadius:9 }}>
                  <div style={{ width:`${(count / maxSt) * 100}%`, height:"100%", borderRadius:9, background:stateColors[i % 6], transition:"width 0.7s ease" }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── Facility type breakdown ── */}
      <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", marginBottom:22 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:16 }}>Facility Type Breakdown</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {typeRows.length === 0
            ? [["Pharmacy", 0, C.primary], ["Retail", 0, "#7c3aed"], ["Hospital", 0, C.amber], ["Wholesale", 0, C.rose]].map(([l,, c]) => (
                <div key={l} style={{ background:C.bg, borderRadius:12, padding:"16px 18px", border:`1px solid ${C.border}`, borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:32, fontWeight:800, color:c, lineHeight:1 }}>0</div>
                  <div style={{ fontSize:11.5, color:C.muted, marginTop:5 }}>{l}</div>
                </div>
              ))
            : typeRows.map(([type, count], i) => {
                const colors = [C.primary, "#7c3aed", C.amber, C.rose];
                const color = colors[i % 4];
                return (
                  <div key={type} style={{ background:C.bg, borderRadius:12, padding:"16px 18px", border:`1px solid ${C.border}`, borderTop:`3px solid ${color}` }}>
                    <div style={{ fontSize:32, fontWeight:800, color, lineHeight:1 }}>{count}</div>
                    <div style={{ fontSize:11.5, color:C.muted, marginTop:5, textTransform:"capitalize" }}>{type}</div>
                    <div style={{ height:4, borderRadius:9, background:"#e2e8f0", marginTop:10 }}>
                      <div style={{ width:`${pharmacies.length ? (count / pharmacies.length) * 100 : 0}%`, height:"100%", borderRadius:9, background:color }} />
                    </div>
                    <div style={{ fontSize:10.5, color:C.muted, marginTop:4 }}>{pharmacies.length ? Math.round((count / pharmacies.length) * 100) : 0}% of pharmacies</div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ── Pending action cards ── */}
      {pending.length > 0 ? (
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", border:`1.5px solid ${C.amberBorder}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div>
              <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>Requires Your Action</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>These pharmacies are waiting for admin review</div>
            </div>
            <span style={{ background:C.amberLight, color:"#92400e", border:`1px solid ${C.amberBorder}`, borderRadius:99, padding:"4px 12px", fontSize:11.5, fontWeight:700 }}>{pending.length} pending</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {pending.map(p => (
              <div key={p._id} style={{ background:C.bg, borderRadius:12, border:`1.5px solid ${C.border2}`, overflow:"hidden" }}>
                <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${C.border2}` }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{p.facilityName}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{p.city}, {p.state}</div>
                  <div style={{ fontSize:11.5, color:C.slate, marginTop:3 }}>{p.email} · {p.phone}</div>
                  <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                    {(p.licenseNumber || p.drugLicenseNumber) && <span style={{ fontSize:11, background:"#f1f5f9", borderRadius:6, padding:"2px 8px", color:C.slate, fontFamily:"monospace" }}>{p.licenseNumber || p.drugLicenseNumber}</span>}
                    <span style={{ fontSize:11, background:C.amberLight, borderRadius:6, padding:"2px 8px", color:"#92400e", fontWeight:600 }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                    </span>
                  </div>
                </div>
                <div style={{ padding:"10px 16px", display:"flex", gap:8 }}>
                  <button onClick={() => handleApprove(p._id, p.facilityName)} disabled={actionLoading === p._id}
                    style={{ flex:1, padding:"8px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:12.5, cursor:"pointer", fontFamily:"inherit", opacity:actionLoading===p._id?0.7:1 }}>
                    {actionLoading === p._id ? "..." : "Approve"}
                  </button>
                  <button onClick={() => setRejectTarget(p)}
                    style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${C.redBorder}`, background:C.redLight, color:"#be123c", fontWeight:700, fontSize:12.5, cursor:"pointer", fontFamily:"inherit" }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background:"#fff", borderRadius:14, padding:"40px 24px", border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:C.greenLight, border:`1.5px solid ${C.greenBorder}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:20 }}>✓</div>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>All caught up!</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>No pharmacies pending review right now.</div>
        </div>
      )}

      {rejectTarget && <RejectModal pharmacy={rejectTarget} onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} loading={!!actionLoading} />}
    </div>
  );
}