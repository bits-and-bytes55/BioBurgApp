import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const C = {
  primary:"#0077a3", primaryDark:"#005580", green:"#10b981", greenLight:"#ecfdf5",
  greenBorder:"#6ee7b7", amber:"#f59e0b", amberLight:"#fffbeb", amberBorder:"#fde68a",
  red:"#ef4444", redLight:"#fff1f2", redBorder:"#fecdd3", rose:"#f43f5e",
  purple:"#8b5cf6", purpleLight:"#f5f3ff", purpleBorder:"#ddd6fe",
  slate:"#64748b", text:"#0f172a", muted:"#94a3b8", border:"#f1f5f9", border2:"#e2e8f0", bg:"#f8fafc",
};

const GS = `
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .h-row:hover td{background:#f8fafc!important}
  .h-card-hover:hover{box-shadow:0 4px 16px rgba(0,0,0,0.09)!important;transform:translateY(-2px)!important}
  @media(max-width:768px){
    .resp-stats{grid-template-columns:1fr 1fr!important}
    .resp-header{flex-direction:column!important;align-items:flex-start!important;gap:10px!important}
    .resp-table{display:none!important}
    .resp-cards{display:block!important}
  }
  @media(min-width:769px){.resp-cards{display:none!important}}
`;

const fmtMoney = n =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000   ? `₹${(n / 1000).toFixed(1)}k`
  : `₹${n}`;

function LiveBadge({ lastSync }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.greenLight, border:`1px solid ${C.greenBorder}`, borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#065f46" }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, animation:"pulse 1.5s ease-in-out infinite", display:"inline-block" }}/>Live
      </span>
      {lastSync && <span style={{ fontSize:11, color:"#cbd5e1" }}>Synced {lastSync.toLocaleTimeString("en-IN")}</span>}
    </div>
  );
}

function RejectModal({ hospital, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, backdropFilter:"blur(2px)", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:18, padding:"28px", width:"100%", maxWidth:460, boxShadow:"0 30px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ height:4, background:"linear-gradient(90deg,#ef4444,#f97316)", borderRadius:4, marginBottom:22 }}/>
        <h3 style={{ margin:"0 0 6px", fontSize:19, fontWeight:800, color:C.text }}>Reject Hospital</h3>
        <p style={{ margin:"0 0 18px", fontSize:13, color:C.slate }}>Rejecting <strong>{hospital?.facilityName}</strong>. Provide an optional reason.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Invalid registration number…" rows={4}
          style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1.5px solid ${C.border2}`, fontSize:13.5, color:"#334155", resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:C.bg }}
          onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border2}/>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:C.bg, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:C.slate }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:C.red, color:"#fff", fontWeight:700, fontSize:13, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading?0.7:1 }}>
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HospitalActive() {
  const [hospitals,     setHospitals]     = useState([]);
  const [orderSummary,  setOrderSummary]  = useState([]);   // ✅ per-hospital order totals
  const [loading,       setLoading]       = useState(true);
  const [lastSync,      setLastSync]      = useState(null);
  const [search,        setSearch]        = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);
  const token = localStorage.getItem("adminToken");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // ✅ Fetch hospitals + order summary in parallel
      const [hospRes, orderRes] = await Promise.allSettled([
        axios.get(`${BASE_API}/api/hospital/all`,    { headers }),
        axios.get(`${BASE_API}/api/hospital/orders`, { headers }),
      ]);

      if (hospRes.status === "fulfilled") {
        setHospitals((hospRes.value.data.hospitals || []).filter(h => h.status === "approved"));
        setLastSync(new Date());
      } else if (!silent) {
        toast.error("Failed to load hospitals");
      }

      if (orderRes.status === "fulfilled") {
        setOrderSummary(orderRes.value.data.summary || []);
      }
    } catch {
      if (!silent) toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget._id + "-reject");
    try {
      await axios.patch(`${BASE_API}/api/hospital/reject/${rejectTarget._id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${rejectTarget.facilityName} rejected`);
      setRejectTarget(null);
      fetchData(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Build a quick lookup: hospitalId → { count, revenue }
  const orderMap = {};
  orderSummary.forEach(s => {
    orderMap[s.hospitalId] = { count: s.count || 0, revenue: s.revenue || 0 };
  });

  // ── Aggregate stats for active hospitals only
  const totalOrders  = hospitals.reduce((a, h) => a + (orderMap[h._id]?.count   || 0), 0);
  const totalRevenue = hospitals.reduce((a, h) => a + (orderMap[h._id]?.revenue || 0), 0);
  const hospitalsWithOrders = hospitals.filter(h => (orderMap[h._id]?.count || 0) > 0).length;

  const filtered = hospitals.filter(h => {
    const q = search.toLowerCase();
    return !q
      || h.facilityName?.toLowerCase().includes(q)
      || h.email?.toLowerCase().includes(q)
      || h.city?.toLowerCase().includes(q)
      || h.registrationNumber?.toLowerCase().includes(q)
      || h.state?.toLowerCase().includes(q);
  });

  const statusBadge = (s) => {
    const map = {
      approved: { bg:C.greenLight,  color:"#065f46",  border:C.greenBorder,  text:"Approved" },
      pending:  { bg:C.amberLight,  color:"#92400e",  border:C.amberBorder,  text:"Pending"  },
      rejected: { bg:C.redLight,    color:"#be123c",  border:C.redBorder,    text:"Rejected" },
    };
    const st = map[s] || { bg:C.bg, color:C.slate, border:C.border2, text:s };
    return <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{st.text}</span>;
  };

  const OrderBadge = ({ hospitalId }) => {
    const o = orderMap[hospitalId];
    if (!o || o.count === 0) return <span style={{ fontSize:12, color:C.muted }}>—</span>;
    return (
      <div>
        <span style={{ background:"#eff6ff", color:"#1d4ed8", borderRadius:6, padding:"2px 9px", fontSize:12, fontWeight:700 }}>{o.count} orders</span>
        <div style={{ fontSize:11, color:C.green, fontWeight:600, marginTop:3 }}>{fmtMoney(o.revenue)}</div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{GS}</style>

      {/* ── Header ── */}
      <div className="resp-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:26, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:4, height:40, borderRadius:4, background:`linear-gradient(180deg,${C.primary},${C.primaryDark})`, flexShrink:0 }}/>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>Active Hospitals</h1>
            <p style={{ margin:"3px 0 0", fontSize:13, color:C.muted }}>All approved hospitals currently live on the platform</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <LiveBadge lastSync={lastSync}/>
          <button onClick={() => fetchData()} style={{ padding:"8px 18px", borderRadius:9, border:`1.5px solid ${C.border2}`, background:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", color:C.slate, fontFamily:"inherit" }}>Refresh</button>
        </div>
      </div>

      {/* ── Stats — Active Hospitals / Total Orders / Revenue / Hospitals w/ Orders ── */}
      <div className="resp-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[
          ["Active Hospitals",       hospitals.length,              C.green,   null],
          ["Total Orders",           totalOrders,                   C.primary, "from active hospitals"],
          ["Order Revenue",          fmtMoney(totalRevenue),        C.purple,  "collected via platform"],
          ["Hospitals w/ Orders",    hospitalsWithOrders,           C.amber,   `of ${hospitals.length} active`],
        ].map(([l, v, c, sub]) => (
          <div key={l} style={{ background:"#fff", borderRadius:12, padding:"18px 22px", border:`1px solid ${C.border}`, borderTop:`3px solid ${c}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", animation:"fadein 0.4s ease both" }}>
            <div style={{ fontSize:30, fontWeight:800, color:C.text, letterSpacing:"-1.5px", lineHeight:1 }}>{v}</div>
            <div style={{ fontSize:10.5, color:C.muted, marginTop:5, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>{l}</div>
            {sub && <div style={{ fontSize:11.5, color:C.slate, marginTop:3 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ background:"#fff", borderRadius:14, padding:"10px 14px", border:`1px solid ${C.border}`, marginBottom:20, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#cbd5e1", fontSize:15 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search active hospitals…"
            style={{ width:"100%", padding:"9px 12px 9px 32px", borderRadius:9, border:`1.5px solid ${C.border2}`, fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box", fontFamily:"inherit", color:"#334155" }}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border2}/>
        </div>
        <span style={{ fontSize:12.5, color:"#cbd5e1", whiteSpace:"nowrap" }}>{filtered.length} active</span>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
          <div style={{ width:36, height:36, border:`3px solid ${C.border2}`, borderTopColor:C.primary, borderRadius:"50%", animation:"spin 0.9s linear infinite" }}/>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ background:"#fff", borderRadius:14, padding:"60px 24px", border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#cbd5e1" }}>No active hospitals match your search</div>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="resp-table" style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760 }}>
                <thead>
                  <tr style={{ background:C.bg, borderBottom:`1.5px solid ${C.border2}` }}>
                    {["Hospital", "Contact", "Location", "Reg. No.", "Orders & Revenue", "Status", "Action"].map(c => (
                      <th key={c} style={{ padding:"12px 16px", textAlign:"left", fontSize:10.5, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h, i) => (
                    <tr key={h._id} className="h-row" style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{h.facilityName}</div>
                        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{h.email}</div>
                      </td>
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ fontSize:13, color:"#334155" }}>{h.contactPerson || "—"}</div>
                        <div style={{ fontSize:12, color:C.muted }}>{h.phone || ""}</div>
                      </td>
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ fontSize:13 }}>{h.city || "—"}</div>
                        <div style={{ fontSize:12, color:C.muted }}>{h.state || ""}</div>
                      </td>
                      <td style={{ padding:"14px 16px", fontSize:12, color:C.slate, fontFamily:"monospace" }}>
                        {h.registrationNumber || "—"}
                      </td>
                      {/* ✅ Live orders & revenue per hospital */}
                      <td style={{ padding:"14px 16px" }}>
                        <OrderBadge hospitalId={h._id} />
                      </td>
                      <td style={{ padding:"14px 16px" }}>{statusBadge(h.status)}</td>
                      <td style={{ padding:"14px 16px" }}>
                        <button onClick={() => setRejectTarget(h)}
                          style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${C.redBorder}`, background:C.redLight, color:"#be123c", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="resp-cards">
            {filtered.map(h => {
              const o = orderMap[h._id];
              return (
                <div key={h._id} className="h-card-hover" style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, marginBottom:14, overflow:"hidden", transition:"all .2s" }}>
                  <div style={{ padding:"16px 18px", borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{h.facilityName}</div>
                        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{h.email}</div>
                      </div>
                      {statusBadge(h.status)}
                    </div>
                    <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase" }}>Location</div>
                        <div style={{ fontSize:13 }}>{h.city}, {h.state}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase" }}>Orders</div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.primary }}>{o?.count || 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase" }}>Revenue</div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.green }}>{o?.revenue ? fmtMoney(o.revenue) : "—"}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"10px 18px", display:"flex", justifyContent:"flex-end" }}>
                    <button onClick={() => setRejectTarget(h)}
                      style={{ padding:"8px 20px", borderRadius:9, border:`1.5px solid ${C.redBorder}`, background:C.redLight, color:"#be123c", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {rejectTarget && (
        <RejectModal hospital={rejectTarget} onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} loading={!!actionLoading}/>
      )}
    </div>
  );
}