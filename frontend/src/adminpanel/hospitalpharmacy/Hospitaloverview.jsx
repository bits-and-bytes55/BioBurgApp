import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const C = {
  primary:"#0077a3", primaryDark:"#005580", green:"#10b981", greenLight:"#ecfdf5",
  greenBorder:"#6ee7b7", amber:"#f59e0b", amberLight:"#fffbeb", amberBorder:"#fde68a",
  red:"#ef4444", redLight:"#fff1f2", redBorder:"#fecdd3", rose:"#f43f5e",
  purple:"#8b5cf6", purpleLight:"#f5f3ff", purpleBorder:"#ddd6fe",
  slate:"#64748b", text:"#0f172a", muted:"#94a3b8",
  border:"#f1f5f9", border2:"#e2e8f0", bg:"#f8fafc",
};

const GS = `
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .h-card:hover{box-shadow:0 6px 20px rgba(0,0,0,0.10)!important;transform:translateY(-2px)!important}
  .h-tr:hover td{background:#f8fafc!important}
  @media(max-width:768px){
    .resp-grid-4{grid-template-columns:1fr 1fr!important}
    .resp-grid-3{grid-template-columns:1fr!important}
    .resp-charts{grid-template-columns:1fr!important}
    .resp-services{grid-template-columns:1fr 1fr!important}
    .resp-header{flex-direction:column!important;align-items:flex-start!important}
    .resp-hide{display:none!important}
    .resp-orders-table{display:none!important}
    .resp-orders-cards{display:block!important}
  }
  @media(min-width:769px){
    .resp-orders-cards{display:none!important}
  }
`;

const fmtMoney = n =>
  n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000   ? `₹${(n/1000).toFixed(1)}k`
  : `₹${n}`;

/* ── Live badge ── */
function LiveBadge({ lastSync }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.greenLight, border:`1px solid ${C.greenBorder}`, borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#065f46" }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block", animation:"pulse 1.5s ease-in-out infinite" }}/>Live
      </span>
      {lastSync && <span style={{ fontSize:11, color:"#cbd5e1" }}>Synced {lastSync.toLocaleTimeString("en-IN")}</span>}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, borderColor, sub }) {
  return (
    <div className="h-card" style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:`1px solid ${C.border}`, borderTop:`3px solid ${borderColor}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", flex:1, minWidth:120, transition:"all .2s", animation:"fadein 0.4s ease both" }}>
      <div style={{ fontSize:32, fontWeight:800, color:C.text, letterSpacing:"-1.5px", lineHeight:1 }}>{value ?? 0}</div>
      <div style={{ fontSize:10.5, color:C.muted, marginTop:6, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</div>
      {sub && <div style={{ fontSize:11.5, color:C.slate, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

/* ── Donut chart ── */
function DonutChart({ segments, total }) {
  const r=42, cx=60, cy=60, stroke=15, circ=2*Math.PI*r;
  let offset=0;
  const arcs = segments.filter(s=>s.value>0).map(s=>{
    const dash=(s.value/(total||1))*circ;
    const arc={...s,dash,gap:circ-dash,offset};offset+=dash;return arc;
  });
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke}/>
      {arcs.map((a,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={stroke}
          strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={-a.offset+circ*0.25} strokeLinecap="butt"/>
      ))}
      <text x={cx} y={cy-7} textAnchor="middle" fontSize={8.5} fill={C.muted} fontFamily="inherit">Total</text>
      <text x={cx} y={cy+13} textAnchor="middle" fontSize={24} fontWeight="800" fill={C.text} fontFamily="inherit">{total}</text>
    </svg>
  );
}

/* ── Bar chart ── */
function BarChart({ data, color }) {
  if (!data || data.length===0) return <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:12 }}>No registration data yet</div>;
  const max=Math.max(...data.map(d=>d.value),1), w=100/data.length;
  return (
    <svg width="100%" height={100} viewBox="0 0 100 100" preserveAspectRatio="none">
      {data.map((d,i)=>{
        const barH=Math.max(2,(d.value/max)*72), x=i*w+w*0.18;
        return (
          <g key={i}>
            <rect x={`${x}%`} y={72-barH} width={`${w*0.64}%`} height={barH} fill={color} rx={2} opacity={0.82}/>
            {d.value>0&&<text x={`${i*w+w/2}%`} y={68-barH} textAnchor="middle" fontSize={6} fill={color} fontFamily="inherit" fontWeight="700">{d.value}</text>}
            <text x={`${i*w+w/2}%`} y={84} textAnchor="middle" fontSize={6} fill={C.muted} fontFamily="inherit">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Reject modal ── */
function RejectModal({ hospital, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, backdropFilter:"blur(2px)", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:18, padding:"28px 28px", width:"100%", maxWidth:460, boxShadow:"0 30px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ height:4, background:"linear-gradient(90deg,#ef4444,#f97316)", borderRadius:4, marginBottom:22 }}/>
        <h3 style={{ margin:"0 0 6px", fontSize:19, fontWeight:800, color:C.text }}>Reject Hospital</h3>
        <p style={{ margin:"0 0 4px", fontSize:13.5, color:C.slate }}>Rejecting <strong style={{ color:C.text }}>{hospital?.facilityName}</strong>.</p>
        <p style={{ margin:"0 0 18px", fontSize:12.5, color:C.muted }}>This blocks the hospital from logging in. Provide an optional reason.</p>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Invalid registration number, incomplete documents..." rows={4}
          style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${C.border2}`, fontSize:13.5, color:"#334155", resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:C.bg }}
          onFocus={e=>e.target.style.borderColor=C.red} onBlur={e=>e.target.style.borderColor=C.border2}/>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:C.bg, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.slate }}>Cancel</button>
          <button onClick={()=>onConfirm(reason)} disabled={loading}
            style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:C.red, color:"#fff", fontWeight:700, fontSize:13, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading?0.7:1 }}>
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Order status pill ── */
function OrderStatusPill({ status }) {
  const map = {
    PLACED:           { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
    CONFIRMED:        { bg:C.greenLight, color:"#065f46", border:C.greenBorder },
    PROCESSING:       { bg:C.purpleLight, color:"#5b21b6", border:C.purpleBorder },
    SHIPPED:          { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
    OUT_FOR_DELIVERY: { bg:C.amberLight, color:"#92400e", border:C.amberBorder },
    DELIVERED:        { bg:C.greenLight, color:"#065f46", border:C.greenBorder },
    CANCELLED:        { bg:C.redLight, color:"#be123c", border:C.redBorder },
    UNDER_REVIEW:     { bg:C.amberLight, color:"#92400e", border:C.amberBorder },
    APPROVED:         { bg:C.greenLight, color:"#065f46", border:C.greenBorder },
    REJECTED:         { bg:C.redLight, color:"#be123c", border:C.redBorder },
  };
  const s = map[status] || { bg:C.bg, color:C.slate, border:C.border2 };
  return (
    <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
      {status?.replace(/_/g," ") || "—"}
    </span>
  );
}

export default function HospitalOverview() {
  const [hospitals,    setHospitals]    = useState([]);
  const [orders,       setOrders]       = useState([]);     
  const [orderSummary, setOrderSummary] = useState([]);      
  const [loading,      setLoading]      = useState(true);
  const [lastSync,     setLastSync]     = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading,setActionLoading]= useState(null);
  const [orderSearch,  setOrderSearch]  = useState("");
  const [orderFilter,  setOrderFilter]  = useState("all");
  const token = localStorage.getItem("adminToken");

  const fetchData = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [hospRes, orderRes] = await Promise.allSettled([
        axios.get(`${BASE_API}/api/hospital/all`,    { headers: h }),
        axios.get(`${BASE_API}/api/hospital/orders`, { headers: h }),
      ]);
      if (hospRes.status  === "fulfilled") { setHospitals(hospRes.value.data.hospitals || []);  setLastSync(new Date()); }
      else if (!silent) toast.error("Failed to load hospitals");
      if (orderRes.status === "fulfilled") {
        setOrders(orderRes.value.data.orders   || []);
        setOrderSummary(orderRes.value.data.summary || []);
      }
    } catch { if (!silent) toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleApprove = async (id, name) => {
    setActionLoading(id);
    try {
      await axios.patch(`${BASE_API}/api/hospital/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${name} approved`); fetchData(true);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget._id);
    try {
      await axios.patch(`${BASE_API}/api/hospital/reject/${rejectTarget._id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${rejectTarget.facilityName} rejected`); setRejectTarget(null); fetchData(true);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setActionLoading(null); }
  };

  /* derived data */
  const approved = hospitals.filter(h => h.status === "approved");
  const pending  = hospitals.filter(h => h.status === "pending");
  const rejected = hospitals.filter(h => h.status === "rejected");

  // Real-time facility fields 
  const totalBeds      = approved.reduce((a,h) => a + (+h.numberOfBeds || 0), 0);
  const facilityTypes  = [...new Set(approved.map(h => h.facilityType).filter(Boolean))];


  // Services from APPROVED hospitals
  const services = [
    ["Emergency Services",  approved.filter(h=>h.emergencyServices).length, C.rose],
    ["Ambulance Available", approved.filter(h=>h.ambulanceService).length,  C.amber],
    ["24×7 Pharmacy",       approved.filter(h=>h.pharmacy24x7).length,      C.green],
    ["ICU Facility",        approved.filter(h=>h.icuAvailable).length,       C.primary],
  ];

  // Orders aggregation
  const totalOrders = orderSummary.length > 0
    ? orderSummary.reduce((a, s) => a + (s.count || 0), 0)
    : orders.length;
  const totalRevenue = orderSummary.length > 0
    ? orderSummary.reduce((a, s) => a + (s.revenue || 0), 0)
    : orders.reduce((a,o) => a + (o.totalAmount || 0), 0);

  // per-hospital map
  const perHospMap = {};
  orderSummary.forEach(s => { perHospMap[s.hospitalId] = { name: s.facilityName, count: s.count, revenue: s.revenue }; });
  if (orderSummary.length === 0) {
    orders.forEach(o => {
      const ref = o.hospitalRef;
      const hid = ref?._id?.toString() || "unknown";
      const hname = ref?.facilityName || "Unknown Hospital";
      if (!perHospMap[hid]) perHospMap[hid] = { name:hname, count:0, revenue:0 };
      perHospMap[hid].count++;
      perHospMap[hid].revenue += o.totalAmount || 0;
    });
  }
  const topHospitals = Object.values(perHospMap)
    .filter(h => h.name !== "Unknown Hospital")
    .sort((a,b) => b.count - a.count)
    .slice(0, 6);
  const maxOrders = Math.max(...topHospitals.map(h => h.count), 1);

  // Order status breakdown (for donut / filter)
  const ORDER_STATUSES = ["PLACED","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];
  const orderStatusCounts = ORDER_STATUSES.reduce((a, s) => ({
    ...a, [s]: orders.filter(o => o.orderStatus === s).length
  }), {});

  // Filtered orders for the orders table
  const filteredOrders = orders
    .filter(o => orderFilter === "all" || o.orderStatus === orderFilter)
    .filter(o => {
      if (!orderSearch) return true;
      const q = orderSearch.toLowerCase();
      return (o.orderId || "").toLowerCase().includes(q)
        || (o.orderStatus || "").toLowerCase().includes(q)
        || (o.hospitalRef?.facilityName || "").toLowerCase().includes(q)
        || (o.items || []).some(i => (i.name || "").toLowerCase().includes(q));
    });

  // Monthly registrations
  const monthlyMap = {};
  for (let i=5; i>=0; i--) { const d=new Date(); d.setMonth(d.getMonth()-i); monthlyMap[d.toLocaleString("en-IN",{month:"short"})]=0; }
  hospitals.forEach(h => { if (!h.createdAt) return; const k=new Date(h.createdAt).toLocaleString("en-IN",{month:"short"}); if (monthlyMap[k]!==undefined) monthlyMap[k]++; });
  const monthlyData = Object.entries(monthlyMap).map(([label,value]) => ({ label, value }));

  // Geographic
  const byState = {};
  hospitals.forEach(h => { if (h.state) byState[h.state]=(byState[h.state]||0)+1; });
  const stateRows   = Object.entries(byState).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxSt       = Math.max(...stateRows.map(([,v])=>v), 1);
  const stateColors = [C.primary,"#7c3aed",C.green,C.amber,C.rose,"#0891b2"];

  const statusBadge = (s) => {
    const map = {
      approved: { bg:C.greenLight, color:"#065f46", border:C.greenBorder, text:"Approved" },
      pending:  { bg:C.amberLight, color:"#92400e", border:C.amberBorder, text:"Pending"  },
      rejected: { bg:C.redLight,   color:"#be123c", border:C.redBorder,   text:"Rejected" },
    };
    const st = map[s] || { bg:C.bg, color:C.slate, border:C.border2, text:s };
    return <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{st.text}</span>;
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, padding:"80px 0" }}>
      <style>{GS}</style>
      <div style={{ width:36, height:36, border:`3px solid ${C.border2}`, borderTopColor:C.primary, borderRadius:"50%", animation:"spin 0.9s linear infinite" }}/>
      <div style={{ fontSize:13, color:C.muted }}>Loading hospital data…</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{GS}</style>

      {/* ── Header ── */}
      <div className="resp-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:26, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:4, height:40, borderRadius:4, background:`linear-gradient(180deg,${C.primary},${C.primaryDark})`, flexShrink:0 }}/>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>Hospital Zone — Overview</h1>
            <p style={{ margin:"3px 0 0", fontSize:13, color:C.muted }}>Live analytics across all registered hospitals</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <LiveBadge lastSync={lastSync}/>
          <button onClick={()=>fetchData()} style={{ padding:"8px 18px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", color:C.slate, fontFamily:"inherit", whiteSpace:"nowrap" }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="resp-grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:16 }}>
        <StatCard label="Total Hospitals"   value={hospitals.length}  borderColor={C.primary}
          sub={approved.length ? `${totalBeds.toLocaleString("en-IN")} beds (active)` : "No active hospitals"}/>
        <StatCard label="Pending Review"    value={pending.length}    borderColor={C.amber}   sub="awaiting action"/>
        <StatCard label="Approved & Active" value={approved.length}   borderColor={C.green}   sub="live on platform"/>
        <StatCard label="Rejected"          value={rejected.length}   borderColor={C.rose}    sub="access blocked"/>
      </div>

      <div className="resp-grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard label="Total Orders"        value={totalOrders}           borderColor={C.purple} sub="across all hospitals"/>
        <StatCard label="Total Revenue"       value={fmtMoney(totalRevenue)}  borderColor={C.green}  sub="platform revenue"/>
        <StatCard label="Hospitals w/ Orders" value={Object.keys(perHospMap).filter(k=>k!=="unknown").length} borderColor={C.primary} sub="placed at least 1"/>
        <StatCard label="Avg Orders/Hospital" value={approved.length ? Math.round(totalOrders/Math.max(approved.length,1)) : 0} borderColor={C.amber} sub="per active hospital"/>
      </div>

      <div className="resp-charts" style={{ display:"grid", gridTemplateColumns:"200px 1fr 1fr", gap:16, marginBottom:22 }}>

        {/* Donut — hospital status split */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Status Split</div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <DonutChart total={hospitals.length} segments={[
              { value:approved.length, color:C.green },
              { value:pending.length,  color:C.amber },
              { value:rejected.length, color:C.rose  },
            ]}/>
            <div style={{ width:"100%" }}>
              {[["Approved",approved.length,C.green],["Pending",pending.length,C.amber],["Rejected",rejected.length,C.rose]].map(([l,v,c])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:C.slate, flex:1 }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly registrations bar chart */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>New Registrations</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>Last 6 months — live data</div>
          <BarChart data={monthlyData} color={C.primary}/>
        </div>

        {/* Geographic spread */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Geographic Spread</div>
          {stateRows.length===0
            ? <div style={{ color:C.muted, fontSize:13 }}>No state data yet</div>
            : stateRows.map(([state,count],i) => (
                <div key={state} style={{ marginBottom:11 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:4 }}>
                    <span style={{ color:C.text, fontWeight:600 }}>{state}</span>
                    <span style={{ color:stateColors[i%6], fontWeight:800 }}>{count}</span>
                  </div>
                  <div style={{ height:5, background:"#f1f5f9", borderRadius:9 }}>
                    <div style={{ width:`${(count/maxSt)*100}%`, height:"100%", borderRadius:9, background:stateColors[i%6], transition:"width .7s" }}/>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

   
      {orders.length > 0 && (
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:16 }}>Order Status Breakdown</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:12 }}>
            {[
              ["Placed",           "PLACED",           C.primary, "#eff6ff"],
              ["Confirmed",        "CONFIRMED",         C.green,   C.greenLight],
              ["Processing",       "PROCESSING",        "#8b5cf6", C.purpleLight],
              ["Shipped",          "SHIPPED",           C.primary, "#eff6ff"],
              ["Out for Delivery", "OUT_FOR_DELIVERY",  C.amber,   C.amberLight],
              ["Delivered",        "DELIVERED",         C.green,   C.greenLight],
              ["Cancelled",        "CANCELLED",         C.red,     C.redLight],
            ].map(([label, key, color, bg]) => (
              <div key={key} style={{ background:bg, borderRadius:10, padding:"14px 16px", border:`1px solid ${color}22` }}>
                <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>{orderStatusCounts[key] || 0}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:5, fontWeight:600 }}>{label}</div>
                <div style={{ height:3, borderRadius:9, background:`${color}22`, marginTop:8 }}>
                  <div style={{ width:`${totalOrders ? ((orderStatusCounts[key]||0)/totalOrders)*100 : 0}%`, height:"100%", borderRadius:9, background:color }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topHospitals.length > 0 && (
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:16 }}>
            Orders Per Hospital (Top {topHospitals.length})
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:460, fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${C.border2}` }}>
                  {["Hospital","Orders","Revenue","Avg/Order","Share"].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topHospitals.map((h,i) => (
                  <tr key={i} className="h-tr" style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:800, flexShrink:0 }}>
                          {h.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight:600, color:C.text }}>{h.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ background:"#eff6ff", color:"#1d4ed8", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{h.count}</span>
                    </td>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:C.green }}>{fmtMoney(h.revenue)}</td>
                    <td style={{ padding:"10px 12px", color:C.slate }}>{fmtMoney(Math.round(h.revenue/Math.max(h.count,1)))}</td>
                    <td style={{ padding:"10px 12px", minWidth:100 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:5, background:"#f1f5f9", borderRadius:9 }}>
                          <div style={{ width:`${(h.count/maxOrders)*100}%`, height:"100%", borderRadius:9, background:C.primary }}/>
                        </div>
                        <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>{Math.round((h.count/Math.max(totalOrders,1))*100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", marginBottom:22, overflow:"hidden" }}>
        {/* Section header */}
        <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, background:C.bg }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em" }}>
            All Platform Orders
            <span style={{ marginLeft:8, background:C.purpleLight, color:"#5b21b6", border:`1px solid ${C.purpleBorder}`, borderRadius:99, padding:"2px 9px", fontSize:10.5, fontWeight:700 }}>
              {orders.length} total
            </span>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {/* Status filter tabs */}
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {[["All","all"],["Placed","PLACED"],["Processing","PROCESSING"],["Delivered","DELIVERED"],["Cancelled","CANCELLED"]].map(([label,val])=>(
                <button key={val} onClick={()=>setOrderFilter(val)}
                  style={{ padding:"5px 12px", borderRadius:7, border:`1.5px solid ${orderFilter===val?C.primary:C.border2}`, background:orderFilter===val?C.primary:"#fff", color:orderFilter===val?"#fff":C.slate, fontSize:11.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                  {label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#cbd5e1", fontSize:14 }}>⌕</span>
              <input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Search orders…"
                style={{ padding:"7px 10px 7px 28px", borderRadius:8, border:`1.5px solid ${C.border2}`, fontSize:12, outline:"none", background:"#fff", fontFamily:"inherit", color:"#334155", width:160 }}
                onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border2}/>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="resp-orders-table" style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760, fontSize:13 }}>
            <thead>
              <tr style={{ background:C.bg, borderBottom:`1.5px solid ${C.border2}` }}>
                {["Order ID","Hospital","Date","Items","Amount","Payment","Status"].map(col=>(
                  <th key={col} style={{ padding:"10px 14px", textAlign:"left", fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:"48px", color:C.muted, fontSize:13 }}>
                  {orders.length === 0 ? "No orders placed yet." : "No orders match your filter."}
                </td></tr>
              )}
              {filteredOrders.map((o,i) => (
                <tr key={o._id} className="h-tr" style={{ borderBottom: i < filteredOrders.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ fontFamily:"monospace", color:C.primary, fontWeight:800, fontSize:12 }}>
                      {o.orderId || o._id?.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{o.hospitalRef?.facilityName || "—"}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{o.hospitalRef?.city || ""}</div>
                  </td>
                  <td style={{ padding:"12px 14px", color:C.muted, fontSize:12, whiteSpace:"nowrap" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ maxWidth:180 }}>
                      {(o.items || []).slice(0,2).map((item,j)=>(
                        <div key={j} style={{ fontSize:12, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {item.name || "Unnamed"} × {item.quantity}
                        </div>
                      ))}
                      {(o.items?.length || 0) > 2 && <div style={{ fontSize:11, color:C.muted }}>+{o.items.length - 2} more</div>}
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <strong style={{ color:C.green }}>{fmtMoney(o.totalAmount || 0)}</strong>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <div>
                      <span style={{ fontSize:11.5, background:o.paymentMode==="ONLINE"?"#eff6ff":C.bg, color:o.paymentMode==="ONLINE"?C.primary:C.slate, border:`1px solid ${o.paymentMode==="ONLINE"?C.primary:C.border2}`, borderRadius:6, padding:"2px 8px", fontWeight:600 }}>
                        {o.paymentMode || "—"}
                      </span>
                      {o.paymentStatus && (
                        <div style={{ fontSize:11, color:o.paymentStatus==="PAID"?C.green:C.amber, fontWeight:600, marginTop:3 }}>{o.paymentStatus}</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <OrderStatusPill status={o.orderStatus}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile order cards */}
        <div className="resp-orders-cards" style={{ padding:"12px 14px" }}>
          {filteredOrders.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px", color:C.muted, fontSize:13 }}>No orders match your filter.</div>
          )}
          {filteredOrders.map(o => (
            <div key={o._id} style={{ background:C.bg, borderRadius:10, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontFamily:"monospace", color:C.primary, fontWeight:800, fontSize:12 }}>
                  {o.orderId || o._id?.slice(-8).toUpperCase()}
                </span>
                <OrderStatusPill status={o.orderStatus}/>
              </div>
              <div style={{ fontWeight:700, color:C.text }}>{o.hospitalRef?.facilityName || "—"}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}</div>
              <div style={{ display:"flex", gap:16, marginTop:8 }}>
                <div><div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase" }}>Amount</div><div style={{ fontWeight:700, color:C.green }}>{fmtMoney(o.totalAmount||0)}</div></div>
                <div><div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase" }}>Payment</div><div style={{ fontSize:12, fontWeight:600 }}>{o.paymentMode || "—"}</div></div>
                <div><div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase" }}>Items</div><div style={{ fontSize:12 }}>{o.items?.length || 0}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", marginBottom:22 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:16 }}>
          Services Coverage <span style={{ fontSize:10, fontWeight:500, color:C.muted, textTransform:"none", letterSpacing:0 }}>(active hospitals only)</span>
        </div>
        <div className="resp-services" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {services.map(([label,val,color]) => (
            <div key={label} style={{ background:C.bg, borderRadius:12, padding:"16px 18px", border:`1px solid ${C.border}`, borderTop:`3px solid ${color}` }}>
              <div style={{ fontSize:30, fontWeight:800, color, lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:11.5, color:C.muted, marginTop:5 }}>{label}</div>
              <div style={{ height:4, borderRadius:9, background:"#e2e8f0", marginTop:10 }}>
                <div style={{ width:`${approved.length ? (val/approved.length)*100 : 0}%`, height:"100%", borderRadius:9, background:color }}/>
              </div>
              <div style={{ fontSize:10.5, color:C.muted, marginTop:4 }}>
                {approved.length ? Math.round((val/approved.length)*100) : 0}% of active hospitals
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:22 }}>
        {/* Facility type breakdown */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Facility Types</div>
          {facilityTypes.length === 0
            ? <div style={{ color:C.muted, fontSize:13 }}>No facility type data</div>
            : facilityTypes.map((type, i) => {
                const count = approved.filter(h => h.facilityType === type).length;
                return (
                  <div key={type} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:4 }}>
                      <span style={{ color:C.text, fontWeight:600 }}>{type}</span>
                      <span style={{ color:stateColors[i%6], fontWeight:800 }}>{count}</span>
                    </div>
                    <div style={{ height:5, background:"#f1f5f9", borderRadius:9 }}>
                      <div style={{ width:`${approved.length ? (count/approved.length)*100 : 0}%`, height:"100%", borderRadius:9, background:stateColors[i%6], transition:"width .7s" }}/>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Specializations breakdown */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Top Specializations</div>
          {(() => {
            const specMap = {};
            approved.forEach(h => (h.specializations || []).forEach(s => { specMap[s] = (specMap[s]||0)+1; }));
            const specRows = Object.entries(specMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
            const maxSpec = Math.max(...specRows.map(([,v])=>v), 1);
            return specRows.length === 0
              ? <div style={{ color:C.muted, fontSize:13 }}>No specialization data</div>
              : specRows.map(([spec, count], i) => (
                  <div key={spec} style={{ marginBottom:11 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:4 }}>
                      <span style={{ color:C.text, fontWeight:600 }}>{spec}</span>
                      <span style={{ color:C.primary, fontWeight:800 }}>{count}</span>
                    </div>
                    <div style={{ height:5, background:"#f1f5f9", borderRadius:9 }}>
                      <div style={{ width:`${(count/maxSpec)*100}%`, height:"100%", borderRadius:9, background:C.primary, transition:"width .7s" }}/>
                    </div>
                  </div>
                ));
          })()}
        </div>
      </div>

      {pending.length > 0 ? (
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:`1.5px solid ${C.amberBorder}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>Requires Your Action</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>These hospitals are waiting for admin review</div>
            </div>
            <span style={{ background:C.amberLight, color:"#92400e", border:`1px solid ${C.amberBorder}`, borderRadius:99, padding:"4px 12px", fontSize:11.5, fontWeight:700 }}>
              {pending.length} pending
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {pending.map(h => (
              <div key={h._id} style={{ background:C.bg, borderRadius:12, border:`1.5px solid ${C.border2}`, overflow:"hidden" }}>
                <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${C.border2}` }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{h.facilityName}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{h.city}{h.state ? `, ${h.state}` : ""}{h.pinCode ? ` - ${h.pinCode}` : ""}</div>
                  <div style={{ fontSize:11.5, color:C.slate, marginTop:3 }}>{h.email} · {h.phone}</div>
                  {h.contactPerson && <div style={{ fontSize:11.5, color:C.primary, marginTop:2, fontWeight:600 }}>Contact: {h.contactPerson}</div>}
                  {/* All real fields as chips */}
                  <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                    {h.registrationNumber && <span style={{ fontSize:10.5, background:"#f1f5f9", borderRadius:6, padding:"2px 8px", color:C.slate, fontFamily:"monospace" }}>Reg: {h.registrationNumber}</span>}
                    {h.licenseNumber && <span style={{ fontSize:10.5, background:"#f1f5f9", borderRadius:6, padding:"2px 8px", color:C.slate, fontFamily:"monospace" }}>Lic: {h.licenseNumber}</span>}
                    {h.numberOfBeds && <span style={{ fontSize:10.5, background:"#f1f5f9", borderRadius:6, padding:"2px 8px", color:C.slate }}>{h.numberOfBeds} beds</span>}
                    {h.facilityType && <span style={{ fontSize:10.5, background:C.purpleLight, borderRadius:6, padding:"2px 8px", color:"#5b21b6", fontWeight:600 }}>{h.facilityType}</span>}
                    {h.establishedYear && <span style={{ fontSize:10.5, background:"#f1f5f9", borderRadius:6, padding:"2px 8px", color:C.slate }}>Est. {h.establishedYear}</span>}
                    <span style={{ fontSize:10.5, background:C.amberLight, borderRadius:6, padding:"2px 8px", color:"#92400e", fontWeight:600 }}>
                      {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                    </span>
                  </div>
                  {/* Services flags */}
                  <div style={{ display:"flex", gap:5, marginTop:8, flexWrap:"wrap" }}>
                    {[["Emergency", h.emergencyServices],["Ambulance", h.ambulanceService],["24×7 Rx", h.pharmacy24x7],["ICU", h.icuAvailable]].map(([l,v])=>(
                      <span key={l} style={{ fontSize:10.5, background:v?C.greenLight:C.bg, color:v?"#065f46":C.muted, border:`1px solid ${v?C.greenBorder:C.border2}`, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{l}</span>
                    ))}
                  </div>
                  {/* Address if present */}
                  {h.address && <div style={{ fontSize:11, color:C.muted, marginTop:6, lineHeight:1.4 }}>📍 {h.address}</div>}
                </div>
                <div style={{ padding:"10px 16px", display:"flex", gap:8 }}>
                  <button onClick={()=>handleApprove(h._id,h.facilityName)} disabled={actionLoading===h._id}
                    style={{ flex:1, padding:"8px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:12.5, cursor:"pointer", fontFamily:"inherit", opacity:actionLoading===h._id?0.7:1 }}>
                    {actionLoading===h._id ? "…" : "Approve"}
                  </button>
                  <button onClick={()=>setRejectTarget(h)}
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
          <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>No hospitals pending review right now.</div>
        </div>
      )}

      {rejectTarget && <RejectModal hospital={rejectTarget} onConfirm={handleRejectConfirm} onCancel={()=>setRejectTarget(null)} loading={!!actionLoading}/>}
    </div>
  );
}