import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_API = import.meta.env.VITE_API_BASE_URL;
const STAGES = ["pending","reviewing","shortlisted","rejected","hired"];
const STAGE_COLORS = {
  pending:     {bg:"#fef9c3",color:"#854d0e"},
  reviewing:   {bg:"#eff6ff",color:"#1d4ed8"},
  shortlisted: {bg:"#f0fdf4",color:"#15803d"},
  rejected:    {bg:"#fff1f2",color:"#be123c"},
  hired:       {bg:"#f5f3ff",color:"#6d28d9"},
};
const useWidth=()=>{ const [w,setW]=useState(window.innerWidth); useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w; };

export default function ExServiceApplicationsAdmin() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const w = useWidth(); const isMobile = w < 640;
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization:`Bearer ${token}` };

  const fetchApps = async () => {
    setLoading(true);
    try { const r = await axios.get(`${BASE_API}/api/exservice-jobs/applications`,{headers}); setApps(r.data.data??[]); }
    catch { toast.error("Failed to load applications", {id:"exapps"}); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ fetchApps(); },[]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await axios.put(`${BASE_API}/api/exservice-jobs/applications/${id}`,{status},{headers});
      toast.success("Status updated");
      setApps(p=>p.map(a=>a._id===id?{...a,status}:a));
      if (selected?._id===id) setSelected(p=>({...p,status}));
    } catch { toast.error("Update failed"); }
    finally { setUpdatingId(null); }
  };

  const filtered = apps.filter(a => {
    const matchFilter = filter==="All" || (a.status||"pending")===filter.toLowerCase();
    const matchSearch = !search || a.fullName?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()) || a.applyingFor?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totals = STAGES.reduce((acc,st)=>{ acc[st]=apps.filter(a=>(a.status||"pending")===st).length; return acc; },{});
  const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  return (
    <div style={s.page}>
      <Styles/>
      <div style={s.header}>
        <div>
          <p style={s.label}>Jobs & ExService Zone</p>
          <h1 style={{...s.title,fontSize:isMobile?18:24}}>Ex-Service Applications</h1>
          <p style={s.sub}>All applications from ex-servicemen</p>
        </div>
        <button onClick={fetchApps} style={s.refreshBtn}>Refresh</button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:12,marginBottom:24}}>
        {[{label:"Total",val:apps.length,color:"#0077a3"},...STAGES.map(st=>({label:st.charAt(0).toUpperCase()+st.slice(1),val:totals[st],color:STAGE_COLORS[st].color}))].map(c=>(
          <div key={c.label} style={s.statCard}>
            <p style={{fontSize:isMobile?18:22,fontWeight:700,color:c.color,margin:"0 0 3px"}}>{c.val}</p>
            <p style={{fontSize:11,color:"#64748b",margin:0}}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:12,marginBottom:20}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["All",...STAGES.map(s=>s.charAt(0).toUpperCase()+s.slice(1))].map(f=>{
            const count = f==="All"?apps.length:totals[f.toLowerCase()]||0;
            return (
              <button key={f} onClick={()=>setFilter(f)} style={{...s.filterBtn,background:filter===f?"#0077a3":"#f1f5f9",color:filter===f?"#fff":"#374151"}}>
                {f} {count}
              </button>
            );
          })}
        </div>
        <input type="text" placeholder="Search name, email, role..." value={search} onChange={e=>setSearch(e.target.value)} style={{...s.input,flex:1}}/>
      </div>

      {/* List */}
      {loading ? <div style={s.empty}>Loading...</div>
      : filtered.length===0 ? <div style={s.empty}>No applications found.</div>
      : isMobile ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(a=>{
            const st=a.status||"pending"; const c=STAGE_COLORS[st];
            return (
              <div key={a._id} style={{...s.mCard,borderLeft:`3px solid ${c.color}`}} onClick={()=>setSelected(a)}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <p style={{fontWeight:700,fontSize:14,color:"#0f172a",margin:0}}>{a.fullName}</p>
                  <span style={{...s.chip,background:c.bg,color:c.color}}>{st}</span>
                </div>
                <p style={{fontSize:12,color:"#64748b",margin:"2px 0"}}>{a.applyingFor}{a.jobType ? ` · ${a.jobType}` : ""}</p>
                <p style={{fontSize:12,color:"#94a3b8",margin:"2px 0"}}>{a.serviceArm} · {a.rank||"—"} · {a.yearsOfService||"—"} yrs</p>
                <p style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{fmt(a.createdAt)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>{["#","Applicant","Contact","Applying For","Job Type","Service Arm","Rank","Applied On","Status","Action"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((a,i)=>{
                const st=a.status||"pending"; const c=STAGE_COLORS[st];
                return (
                  <tr key={a._id} style={{...s.tr,background:i%2===0?"#fff":"#f8fafc"}}>
                    <td style={s.td}>{i+1}</td>
                    <td style={s.td}>
                      <p style={{fontWeight:600,fontSize:14,color:"#0f172a",margin:0}}>{a.fullName}</p>
                      <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{a.city}, {a.state}</p>
                    </td>
                    <td style={s.td}><p style={{fontSize:13,margin:0}}>{a.email}</p><p style={{fontSize:12,color:"#64748b",margin:0}}>{a.phone}</p></td>
                    <td style={s.td}><span style={{fontSize:12,background:"#eff8fb",color:"#0077a3",padding:"3px 10px",borderRadius:20,border:"1px solid #bae6fd",whiteSpace:"nowrap"}}>{a.applyingFor}</span></td>
                    <td style={s.td}><span style={{fontSize:12,background:"#f5f3ff",color:"#6d28d9",padding:"3px 10px",borderRadius:20,border:"1px solid #e9d5ff",whiteSpace:"nowrap"}}>{a.jobType||"—"}</span></td>
                    <td style={s.td}><span style={{fontSize:13}}>{a.serviceArm||"—"}</span></td>
                    <td style={s.td}><span style={{fontSize:13}}>{a.rank||"—"}</span></td>
                    <td style={s.td}><span style={{fontSize:13,color:"#64748b"}}>{fmt(a.createdAt)}</span></td>
                    <td style={s.td}><span style={{...s.chip,background:c.bg,color:c.color}}>{st}</span></td>
                    <td style={s.td}><button onClick={()=>setSelected(a)} style={s.viewBtn}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{fontSize:12,color:"#94a3b8",padding:"10px 16px",textAlign:"right"}}>Showing {filtered.length} of {apps.length} applications</p>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
          <div style={{...s.modal,width:isMobile?"95vw":680,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={s.modalHead}>
              <div>
                <h2 style={{fontSize:16,fontWeight:700,color:"#0f172a",margin:0}}>{selected.fullName}</h2>
                <p style={{fontSize:12,color:"#64748b",margin:"3px 0 0"}}>{selected.applyingFor}{selected.jobType ? ` · ${selected.jobType}` : ""}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={s.closeBtn}>✕</button>
            </div>
            <div style={{padding:24,display:"flex",flexDirection:"column",gap:20}}>
              {/* Status update */}
              <div style={{background:"#f8fafc",borderRadius:10,padding:16}}>
                <p style={{fontSize:12,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Update Status</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {STAGES.map(st=>{
                    const c=STAGE_COLORS[st];
                    return (
                      <button key={st} disabled={updatingId===selected._id} onClick={()=>updateStatus(selected._id,st)}
                        style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${c.color}`,background:(selected.status||"pending")===st?c.color:"#fff",color:(selected.status||"pending")===st?"#fff":c.color,fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail sections */}
              {[
                {title:"Personal Information",rows:[["Full Name",selected.fullName],["Email",selected.email],["Phone",selected.phone],["Date of Birth",selected.dateOfBirth],["Gender",selected.gender]]},
                {title:"Address",rows:[["Address",selected.address],["City",selected.city],["State",selected.state],["PIN Code",selected.pinCode]]},
                {title:"Military Service",rows:[["Service Arm",selected.serviceArm],["Rank",selected.rank],["Service Number",selected.serviceNumber],["Years of Service",selected.yearsOfService],["Discharge Type",selected.dischargeType],["Medals / Awards",selected.medals],["Service Record",selected.serviceRecord]]},
                {title:"Civilian Details",rows:[["Qualification",selected.civilianQualification],["Field of Study",selected.fieldOfStudy],["Civilian Experience",selected.civilianExperience],["Current Job Title",selected.currentJobTitle],["Applying For",selected.applyingFor],["Job Type",selected.jobType],["Skills",selected.skills],["Expected Salary",selected.expectedSalary],["Notice Period",selected.noticePeriod],["Preferred Location",selected.preferredLocation],["LinkedIn",selected.linkedIn]]},
              ].map(sec=>(
                <div key={sec.title}>
                  <p style={{fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>{sec.title}</p>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
                    {sec.rows.filter(([,v])=>v).map(([l,v])=>(
                      <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"8px 12px"}}>
                        <p style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>{l}</p>
                        <p style={{fontSize:13,color:"#1e293b",margin:"3px 0 0"}}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {selected.coverLetter && (
                <div>
                  <p style={{fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Cover Letter</p>
                  <p style={{fontSize:14,color:"#374151",lineHeight:1.8,background:"#f8fafc",borderRadius:8,padding:14,whiteSpace:"pre-wrap"}}>{selected.coverLetter}</p>
                </div>
              )}
              {selected.resumeUrl && (
                <a href={`${BASE_API}/${selected.resumeUrl}`} target="_blank" rel="noreferrer" style={{...s.btnPrimary,display:"inline-block",textDecoration:"none",textAlign:"center"}}>
                  Download Resume
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Styles=()=><style>{`input:focus,select:focus{outline:none;border-color:#0077a3!important;box-shadow:0 0 0 3px rgba(0,119,163,0.1)!important;}`}</style>;
const s={
  page:{fontFamily:"'Inter','Segoe UI',sans-serif",padding:0},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,gap:12,flexWrap:"wrap"},
  label:{fontSize:12,fontWeight:600,color:"#0077a3",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4},
  title:{fontWeight:700,color:"#0f172a"},
  sub:{fontSize:13,color:"#64748b",marginTop:4},
  refreshBtn:{padding:"8px 16px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,fontWeight:500,color:"#374151",backgroundColor:"#fff",cursor:"pointer"},
  statCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 16px",textAlign:"center"},
  filterBtn:{padding:"6px 14px",borderRadius:20,border:"none",fontSize:13,fontWeight:600,cursor:"pointer"},
  input:{padding:"9px 14px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,color:"#374151",outline:"none",fontFamily:"inherit"},
  chip:{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,textTransform:"capitalize",whiteSpace:"nowrap"},
  mCard:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:14,cursor:"pointer"},
  tableWrap:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflowX:"auto"},
  table:{width:"100%",borderCollapse:"collapse",minWidth:700},
  th:{padding:"11px 14px",fontSize:11,fontWeight:600,color:"#64748b",textAlign:"left",textTransform:"uppercase",letterSpacing:"0.06em",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"},
  tr:{borderBottom:"1px solid #f1f5f9"},
  td:{padding:"11px 14px",verticalAlign:"middle"},
  viewBtn:{background:"#0077a3",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:600,cursor:"pointer"},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16},
  modal:{background:"#fff",borderRadius:14,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"},
  modalHead:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:"1px solid #eef1f5"},
  closeBtn:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#64748b"},
  btnPrimary:{background:"#0077a3",color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer"},
  empty:{textAlign:"center",padding:"48px 20px",color:"#94a3b8",fontSize:14},
};