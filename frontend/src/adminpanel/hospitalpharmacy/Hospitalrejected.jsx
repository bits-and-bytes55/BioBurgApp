import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

const C = {
  primary:"#0077a3", primaryDark:"#005580", green:"#10b981", greenLight:"#ecfdf5",
  greenBorder:"#6ee7b7", amber:"#f59e0b", amberLight:"#fffbeb", amberBorder:"#fde68a",
  red:"#ef4444", redLight:"#fff1f2", redBorder:"#fecdd3", rose:"#f43f5e",
  slate:"#64748b", text:"#0f172a", muted:"#94a3b8", border:"#f1f5f9", border2:"#e2e8f0", bg:"#f8fafc",
};

const GS = `
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .h-row:hover td{background:#f8fafc!important}
  .h-card-hover:hover{box-shadow:0 4px 16px rgba(0,0,0,.09)!important;transform:translateY(-2px)!important}
  @media(max-width:768px){
    .resp-header{flex-direction:column!important;align-items:flex-start!important;gap:10px!important}
    .resp-table{display:none!important}
    .resp-cards{display:block!important}
  }
  @media(min-width:769px){.resp-cards{display:none!important}}
`;

function LiveBadge({ lastSync }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
      <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:C.greenLight,border:`1px solid ${C.greenBorder}`,borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#065f46" }}>
        <span style={{ width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 1.5s ease-in-out infinite",display:"inline-block" }}/>Live
      </span>
      {lastSync&&<span style={{ fontSize:11,color:"#cbd5e1" }}>Synced {lastSync.toLocaleTimeString("en-IN")}</span>}
    </div>
  );
}

export default function HospitalRejected() {
  const [hospitals,     setHospitals]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [lastSync,      setLastSync]      = useState(null);
  const [search,        setSearch]        = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [detailTarget,  setDetailTarget]  = useState(null);
  const token = localStorage.getItem("adminToken");

  const fetchData = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${BASE_API}/api/hospital/all`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals((res.data.hospitals||[]).filter(h=>h.status==="rejected")); setLastSync(new Date());
    } catch { if (!silent) toast.error("Failed to load hospitals"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchData(); const iv=setInterval(()=>fetchData(true),30000); return ()=>clearInterval(iv); },[fetchData]);

  const handleApprove = async (id,name) => {
    setActionLoading(id+"-approve");
    try { await axios.patch(`${BASE_API}/api/hospital/approve/${id}`,{},{headers:{Authorization:`Bearer ${token}`}}); toast.success(`${name} re-approved`); fetchData(true); }
    catch (err) { toast.error(err?.response?.data?.message||"Failed"); }
    finally { setActionLoading(null); }
  };

  const filtered = hospitals.filter(h=>{ const q=search.toLowerCase(); return !q||h.facilityName?.toLowerCase().includes(q)||h.email?.toLowerCase().includes(q)||h.city?.toLowerCase().includes(q)||h.state?.toLowerCase().includes(q)||h.registrationNumber?.toLowerCase().includes(q); });

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:"80px 0" }}>
      <style>{GS}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.border2}`,borderTopColor:C.primary,borderRadius:"50%",animation:"spin 0.9s linear infinite" }}/>
      <div style={{ fontSize:13,color:C.muted }}>Loading rejected hospitals…</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{GS}</style>

      <div className="resp-header" style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26,gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ width:4,height:40,borderRadius:4,background:`linear-gradient(180deg,${C.rose},#be123c)`,flexShrink:0 }}/>
          <div>
            <h1 style={{ margin:0,fontSize:22,fontWeight:800,color:C.text,letterSpacing:"-0.5px" }}>Rejected Hospitals</h1>
            <p style={{ margin:"3px 0 0",fontSize:13,color:C.muted }}>Hospitals denied platform access</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
          <LiveBadge lastSync={lastSync}/>
          <button onClick={()=>fetchData()} style={{ padding:"8px 18px",borderRadius:9,border:`1.5px solid ${C.border2}`,background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",color:C.slate,fontFamily:"inherit" }}>Refresh</button>
        </div>
      </div>

      {/* Stat */}
      <div style={{ background:"#fff",borderRadius:12,padding:"18px 22px",border:`1px solid ${C.border}`,borderTop:`3px solid ${C.rose}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",marginBottom:22,display:"inline-block",minWidth:160 }}>
        <div style={{ fontSize:30,fontWeight:800,color:C.text,letterSpacing:"-1.5px",lineHeight:1 }}>{hospitals.length}</div>
        <div style={{ fontSize:10.5,color:C.muted,marginTop:5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em" }}>Rejected Hospitals</div>
      </div>

      {/* Toolbar */}
      <div style={{ background:"#fff",borderRadius:14,padding:"10px 14px",border:`1px solid ${C.border}`,marginBottom:20,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#cbd5e1",fontSize:15 }}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search rejected hospitals…"
            style={{ width:"100%",padding:"9px 12px 9px 32px",borderRadius:9,border:`1.5px solid ${C.border2}`,fontSize:13,outline:"none",background:"#fff",boxSizing:"border-box",fontFamily:"inherit",color:"#334155" }}
            onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border2}/>
        </div>
        <span style={{ fontSize:12.5,color:"#cbd5e1",whiteSpace:"nowrap" }}>{filtered.length} rejected</span>
      </div>

      {filtered.length===0&&(
        <div style={{ background:"#fff",borderRadius:14,padding:"60px 24px",border:`1px solid ${C.border}`,textAlign:"center" }}>
          <div style={{ fontSize:13,fontWeight:600,color:"#cbd5e1" }}>No rejected hospitals{search?" matching your search":""}</div>
        </div>
      )}

      {filtered.length>0&&(
        <>
          {/* Desktop table */}
          <div className="resp-table" style={{ background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",minWidth:800 }}>
                <thead>
                  <tr style={{ background:C.bg,borderBottom:`1.5px solid ${C.border2}` }}>
                    {["Hospital","Contact","Location","Reg. No.","Rejected On","Rejection Reason","Action"].map(c=>(
                      <th key={c} style={{ padding:"12px 16px",textAlign:"left",fontSize:10.5,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap" }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h,i)=>(
                    <tr key={h._id} className="h-row" style={{ borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none" }}>
                      <td style={{ padding:"14px 16px" }}><div style={{ fontWeight:700,fontSize:14,color:C.text }}>{h.facilityName}</div><div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{h.email}</div></td>
                      <td style={{ padding:"14px 16px" }}><div style={{ fontSize:13 }}>{h.contactPerson||"—"}</div><div style={{ fontSize:12,color:C.muted }}>{h.phone||""}</div></td>
                      <td style={{ padding:"14px 16px" }}><div style={{ fontSize:13 }}>{h.city||"—"}</div><div style={{ fontSize:12,color:C.muted }}>{h.state||""}</div></td>
                      <td style={{ padding:"14px 16px",fontSize:12.5,color:C.slate,fontFamily:"monospace" }}>{h.registrationNumber||"—"}</td>
                      <td style={{ padding:"14px 16px",fontSize:12,color:C.muted,whiteSpace:"nowrap" }}>{h.updatedAt?new Date(h.updatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</td>
                      <td style={{ padding:"14px 16px",maxWidth:220 }}>
                        {h.rejectionReason
                          ?<div style={{ fontSize:12.5,color:"#7f1d1d",background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:7,padding:"5px 10px",lineHeight:1.5 }}>{h.rejectionReason}</div>
                          :<span style={{ fontSize:12,color:C.muted,fontStyle:"italic" }}>No reason provided</span>}
                      </td>
                      <td style={{ padding:"14px 16px" }}>
                        <button onClick={()=>handleApprove(h._id,h.facilityName)} disabled={actionLoading===h._id+"-approve"}
                          style={{ padding:"7px 16px",borderRadius:8,border:"none",background:C.green,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",opacity:actionLoading===h._id+"-approve"?0.7:1 }}>
                          {actionLoading===h._id+"-approve"?"…":"Re-approve"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="resp-cards">
            {filtered.map(h=>(
              <div key={h._id} className="h-card-hover" style={{ background:"#fff",borderRadius:14,border:`1px solid ${C.redBorder}`,marginBottom:14,overflow:"hidden",transition:"all .2s" }}>
                <div style={{ padding:"16px 18px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontWeight:700,fontSize:15,color:C.text }}>{h.facilityName}</div>
                  <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{h.email}</div>
                  <div style={{ display:"flex",gap:16,marginTop:12,flexWrap:"wrap" }}>
                    <div><div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase" }}>Location</div><div style={{ fontSize:13 }}>{h.city}, {h.state}</div></div>
                    <div><div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase" }}>Rejected</div><div style={{ fontSize:12 }}>{h.updatedAt?new Date(h.updatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"—"}</div></div>
                  </div>
                  {h.rejectionReason&&(
                    <div style={{ marginTop:10,fontSize:12.5,color:"#7f1d1d",background:C.redLight,border:`1px solid ${C.redBorder}`,borderRadius:7,padding:"8px 10px",lineHeight:1.5 }}>
                      <strong>Reason:</strong> {h.rejectionReason}
                    </div>
                  )}
                </div>
                <div style={{ padding:"10px 18px",display:"flex",justifyContent:"flex-end" }}>
                  <button onClick={()=>handleApprove(h._id,h.facilityName)} disabled={actionLoading===h._id+"-approve"}
                    style={{ padding:"8px 20px",borderRadius:9,border:"none",background:C.green,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",opacity:actionLoading===h._id+"-approve"?0.7:1 }}>
                    {actionLoading===h._id+"-approve"?"…":"Re-approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}